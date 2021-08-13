define(function(require){
	var $ = require('jquery'),
		monster = require('monster'),
		toastr = require('toastr');

	require([
		'datatables.net',
		'datatables.net-bs',
		'datatables.net-buttons',
		'datatables.net-buttons-html5',
		'datatables.net-buttons-bootstrap'
	]);

	var app = {
		name: 'rates',

		css: ['app'],

		i18n: { 
			'en-US': { customCss: false }
		},

		requests: {
			'rates.list': {
				'verb': 'GET',
				'url': 'rates'
			},
			'rates.get': {
				'verb': 'GET',
				'url': 'rates/{rateId}'
			},
			'rates.create': {
				'verb': 'PUT',
				'url': 'rates'
			},
			'rates.update': {
				'verb': 'POST',
				'url': 'rates/{rateId}'
			},
			'rates.delete': {
				'verb': 'DELETE',
				'url': 'rates/{rateId}'
			}
		},

		vars: {
			entryDataTable: null
		},

		validationRules: {
			'entryForm': {
				'rate_name': {
					required: true,
					minlength: 1,
					maxlength: 128
				},
				'prefix': {
					required: true,
					minlength: 1,
					maxlength: 128
				},
				'iso_country_code': {
					required: true,
					minlength: 1,
					maxlength: 3
				},
				'rate_cost': {
					required: true,
					minlength: 1,
					maxlength: 128
				},
				'direction': {
					required: true,
					minlength: 1,
					maxlength: 128
				},
				'type': {
					minlength: 1,
					maxlength: 128
				}
			},
		},

		load: function(callback){
			var self = this;

			self.initApp(function() {
				callback && callback(self);
			});
		},

		// Method used by the Monster-UI Framework, shouldn't be touched unless you're doing some advanced kind of stuff!
		initApp: function(callback) {
			var self = this;

			/* Used to init the auth token and account id of self app */
			monster.pub('auth.initApp', {
				app: self,
				callback: callback
			});

			self.initHandlebarsHelpers();
			self.initValidationHelpers();
		},

		initValidationHelpers: function(){
			var self = this;

			jQuery.validator.addMethod('notEqual', function(value, element, param) {
				return this.optional(element) || value != param;
			}, self.i18n.active().rates.validationMessage.specifyDifferentValue);
		},

		initHandlebarsHelpers: function() {
			Handlebars.registerHelper('inc', function(value, options) {
				return parseInt(value) + 1;
			});

			Handlebars.registerHelper('compare', function (lvalue, operator, rvalue, options) {
				var operators, result;

				if (arguments.length < 3) {
					throw new Error('Handlerbars Helper \'compare\' needs 2 parameters');
				}

				if (options === undefined) {
					options = rvalue;
					rvalue = operator;
					operator = '===';
				}

				operators = {
					'==': function (l, r) { return l == r; },
					'===': function (l, r) { return l === r; },
					'!=': function (l, r) { return l != r; },
					'!==': function (l, r) { return l !== r; },
					'<': function (l, r) { return l < r; },
					'>': function (l, r) { return l > r; },
					'<=': function (l, r) { return l <= r; },
					'>=': function (l, r) { return l >= r; },
					'typeof': function (l, r) { return typeof l == r; }
				};

				if (!operators[operator]) {
					throw new Error('Handlerbars Helper \'compare\' doesn\'t know the operator ' + operator);
				}

				result = operators[operator](lvalue, rvalue);

				if (result) {
					return options.fn(this);
				} else {
					return options.inverse(this);
				}

			});
		},

		render: function($container){
			var self = this;
			$container = $container || $('#monster_content');

			var html = $(monster.template(self, 'main', {}));
			$container.empty().append(html);

			self.getLists(function(ratesList) {
				self.renderListItemForm(ratesList);
			});

			self.mainContainerBindEvents($container);
		},

		mainContainerBindEvents: function ($container) {
			var self = this;

			$container.find('.js-new-list').on('click', function(e) {
				e.preventDefault();

				self.renderListItemForm(null, function() {
					var $menuListContainer = $('#rates-list');
					$menuListContainer.find('li.active').removeClass('active');
					$menuListContainer.find('.js-new-list-item').remove();
					$menuListContainer.prepend('<li class="js-new-list-item active"><a>' +
						self.i18n.active().rates.sidebar.menuNewListItemText +'</a></li>');
				});
			});
		},

		getLists: function(callback){
			var self = this;

			monster.request({
				resource: 'rates.list',
				data: {
					accountId: self.accountId,
					generateError: false
				},
				success: function (data) {
					if(typeof(callback) === 'function') {
						callback(data.data);
					}
				}
			});
		},

		getListItem: function(listId, callback){
			var self = this;

			monster.request({
				resource: 'rates.list',
				data: {
					accountId: self.accountId,
					listId: listId,
					generateError: false
				},
				success: function (data) {
					if(typeof(callback) === 'function') {
						callback(data.data);
					}
				}
			});
		},

		getEntry: function(entryId, listId, callback){
			var self = this;

			monster.request({
				resource: 'rates.get',
				data: {
					accountId: self.accountId,
					rateId: entryId,
					generateError: false
				},
				success: function (data) {
					if(typeof(callback) === 'function') {
						callback(data.data);
					}
				}
			});
		},

		getVcard: function(entryId, listId, callback) {
			var self = this;

			var getRandomStr = function(){
				return Math.random().toString(36).substring(7);
			};

			var xmlhttp = new XMLHttpRequest;
			var url = self.apiUrl + 'accounts/' + self.accountId + '/lists/' + listId + '/entries/' + entryId
				+ '/vcard?auth_token=' + monster.util.getAuthToken() + '&_=' + getRandomStr();
			xmlhttp.open('GET', url, true);
			xmlhttp.onreadystatechange = function() {
				if (4 === xmlhttp.readyState) {
					if (200 === xmlhttp.status) {
						if(typeof(callback) === 'function') {
							callback(xmlhttp.responseText);
						}
					} else {
						if(typeof(callback) === 'function') {
							callback(null);
						}
					}
				}
			};
			xmlhttp.send();
		},

		getEntriesOfList: function(listId, callback){
			var self = this;

			monster.request({
				resource: 'rates.list',
				data: {
					accountId: self.accountId,
					listId: listId,
					generateError: false
				},
				success: function (data) {
					if(typeof(callback) === 'function') {
						callback(data.data);
					}
				}
			});
		},

		createEntry: function(listId, data, callback){
			var self = this;

			monster.request({
				resource: 'rates.create',
				data: {
					accountId: self.accountId,
					generateError: false,
					data: data
				},
				success: function (data) {
					if(typeof(callback) === 'function') {
						callback(data.data);
					}
				},
				error: function (data) {
					if(typeof(callback) === 'function') {
						callback(data.data);
					}
				}
			});
		},


		createEntries: function(entriesList, listId, callback) {
			var self = this,
				requests = {};
			
			entriesList.forEach(function(val, i){
				requests['entry' + i] = (function(entryData){
					return function(callback){
						monster.request({
							resource: 'rates.create',
							data: {
								accountId: self.accountId,
								listId: listId,
								generateError: false,
								data: entryData
							},
							success: function(data, status) {
								if(typeof(callback) === 'function') {
									callback(null, data.data);
								}
							}
						});
					}
				})(val);
			});

			monster.parallel(requests, function(err, results){
				if(typeof(callback) === 'function') {
					callback(results);
				}
			});
		},

		updateEntry: function(entryId, listId, data, callback){
			var self = this;
			
			monster.request({
				resource: 'rates.update',
				data: {
					accountId: self.accountId,
					rateId: entryId,
					generateError: false,
					data: data
				},
				success: function (data) {
					if(typeof(callback) === 'function') {
						callback(data.data);
					}
				}
			});
		},

		renderListItemForm: function(listId, callback) {
			var self = this;
			var $container = $('#rates-content');

			if(listId) {
				self.getListItem(listId, function(listItemData) {
					var html = $(monster.template(self, 'listItemContent', {
						isDefaultAddressBook: false
					}));
					$container.empty().append(html);

					self.getEntriesOfList(listId, function(entriesList) {

						self.entriesTableRender(entriesList, listId);

						if(typeof(callback) === 'function') {
							callback(listItemData, entriesList);
						}
					});
				})
			}
		},

		getFormData: function($formEl, selector) {
			if(typeof(selector) === 'undefined') {
				selector = '.js-to-serialize[name]';
			}

			var result = {};
			$formEl.find(selector).each(function(i, el){
				var $el = $(el);
				var name = $el.attr('name');

				if(el.tagName === 'INPUT') {
					if($el.attr('type') === 'checkbox') {
						result[name] = !!$el.is(':checked');
						return;
					}

					if(!!$el.val()) {
						result[name] = $el.val();
						return;
					}
				}

				if(el.tagName === 'SELECT' && !!$el.find('option:selected').val()) {
					result[name] = $el.find('option:selected').val();
				}
			});

			return result;
		},

		entriesTableRender: function(entries, listId, $container, callback) {
			var self = this;
			$container = $container || $('#entries-container');

			var html = $(monster.template(self, 'entries', {
				'entries': entries,
				'listId': listId,
				'entriesButtons': $(monster.template(self, 'entriesButtons', {})).html()
			}));

			$container.empty().html(html);

			var $entriesTable = $container.find('#entries-table');
			self.vars.entryDataTable = $entriesTable.DataTable({
				'bStateSave': false,
				'lengthMenu': [[5, 25, 50, -1], [5, 25, 50, 'All']],
				'columnDefs': [{
					'targets': 'no-sort',
					'orderable': false
				}],
				dom: 'lfrtipB',
				buttons: [
					{
						extend: 'csvHtml5',
						text: 'Export CSV',
						exportOptions: {
							columns: [1,2,3,4,5]
						}
					}
				]
			});

			self.vars.entryDataTable.on('draw', function(e, settings) {
				self.entriesTableBindEvents($(this));
			} );

			self.entriesTableBindEvents($container);
		},

		entriesTableBindEvents: function($container){
			var self = this;

			$container.find('.js-create-entry').not('.handled').on('click', function(e) {
				e.preventDefault();
				var listId = $(this).data('list-id');
				self.showPopupCreateEntry(listId);
			}).addClass('handled');

			$container.find('.js-import-csv').not('.handled').on('change', function(e) {
				e.preventDefault();
				var $fileEl = $(this);

				if(!$fileEl.val()) {
					return;
				}

				var listId = $fileEl.data('list-id');
				self.importEntriesFromCSV(e.target.files, listId, function() {
					$fileEl.val('');
					toastr.success(self.i18n.active().rates.entriesImportSuccessMessage);
				});
			}).addClass('handled');

			$container.find('.js-edit-entry').not('.handled').on('click', function(e) {
				e.preventDefault();
				var $tr = $(this).closest('tr');
				var entryId = $tr.data('entry-id');
				var listId = $tr.data('list-id');
				self.showPopupEditEntry(entryId, listId);
			}).addClass('handled');

			$container.find('.js-remove-entry').not('.handled').on('click', function(e) {
				e.preventDefault();
				var $tr = $(this).closest('tr');
				var entryId = $tr.data('entry-id');
				var listId = $tr.data('list-id');

				monster.ui.confirm(self.i18n.active().rates.deleteEntryConfirmText, function() {
					self.deleteEntry(entryId, listId, function(){
						self.vars.entryDataTable
							.row($tr)
							.remove()
							.draw();
					});
				});
			}).addClass('handled');

			$container.find('.js-get-vcard').not('.handled').on('click', function(e) {
				e.preventDefault();
				var $tr = $(this).closest('tr');
				var entryId = $tr.data('entry-id');
				var listId = $tr.data('list-id');
				var fileName = 'vCard_' + ($tr.find('td:nth-child(2)').text()).replace(/\s/g, '-') + '.vcf';

				self.getVcard(entryId, listId, function(vcardData){
					self.downloadFile(fileName, vcardData)
				});
			}).addClass('handled');

		},

		importEntriesFromCSV: function(files, listId, callback) {
			var self = this;
			if(files.length === 0) {
				return;
			}

			var reader = new FileReader();

			reader.onload = function(e) {
				var entriesArr = self.parseEntriesCSV(e.target.result);

				self.createEntries(entriesArr, listId, function(results) {
					var entriesArr = [];

					for(var i in results) if(results.hasOwnProperty(i)) {
						entriesArr.push(results[i]);
					}

					self.addRowsToEntriesDatatable(entriesArr, listId, function(){
						if(typeof(callback) === 'function') {
							callback();
						}
					});
				});
			};

			reader.readAsText(files[0]);
		},

		downloadFile: function(fileName, text) {
			var element = document.createElement('a');
			element.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
			element.download = fileName;
			element.style.display = 'none';
			document.body.appendChild(element);
			element.click();
			document.body.removeChild(element);
		},

		parseEntriesCSV: function(csv) {
			var lines=csv.split("\n"),
				result = [],
				lineValues,
				entry,
				self = this;

			var removeStartAndEndQuotes = function(text) {
				text = $.trim(text);

				if(text.charAt(0) === '"') {
					text = text.substr(1);
				}

				if(text.charAt(text.length-1) === '"') {
					text = text.slice(0, -1);
				}
				return text;
			};

			// miss headers
			for(var i=1, len=lines.length-1; i<len; i++) {
				lineValues=lines[i].split(',');
				entry = {
					'rate_name': removeStartAndEndQuotes(lineValues[0]) || '',
					'iso_country_code': removeStartAndEndQuotes(lineValues[1]) || '',
					'description': removeStartAndEndQuotes(lineValues[2]) || '',
					'prefix': removeStartAndEndQuotes(lineValues[3]) || '',
					'rate_cost': removeStartAndEndQuotes(lineValues[4]) || '',
					'internal_rate_cost': removeStartAndEndQuotes(lineValues[5]) || '',
					'rate_increment': removeStartAndEndQuotes(lineValues[6]) || '',
					'rate_minimum': removeStartAndEndQuotes(lineValues[7]) || '',
					'direction': removeStartAndEndQuotes(lineValues[8]) || '',
					'weight': removeStartAndEndQuotes(lineValues[9]) || '',
					'rate_surcharge': removeStartAndEndQuotes(lineValues[10]) || '',
					'routes': removeStartAndEndQuotes(lineValues[11]) || '',
				};
				entry = self.formatDataEntry(entry);
				result.push(self.removeEmptyEntryProperties(entry));
			}
			return result;
		},

		deleteEntry: function(entryId, listId, callback) {
			var self = this;

			monster.request({
				resource: 'rates.delete',
				data: {
					accountId: self.accountId,
					listId: listId,
					rateId: entryId,
					generateError: false
				},
				success: function (data) {
					if(typeof(callback) === 'function') {
						callback(data.data);
					}
				}
			});
		},

		showPopupCreateEntry: function(listId, callback){
			var self = this;
			var i18n = self.i18n.active();

			var dialogTemplate = monster.template(self, 'entryForm', {
				entryData: {},
				listId: listId
			});

			var $popup = monster.ui.dialog(dialogTemplate, {
				title: i18n.rates.createEntryDialogTitle,
				dialogClass: 'rates-container rates-dialog'
			});

			self.entryPopupBindEvents($popup, {}, null, listId);
		},

		showPopupEditEntry: function(entryId, listId, callback){
			var self = this;
			var i18n = self.i18n.active();

			self.getEntry(entryId, listId, function(entryData) {
				var dialogTemplate = monster.template(self, 'entryForm', {
					entryData: entryData,
					listId: listId
				});

				var $popup = monster.ui.dialog(dialogTemplate, {
					title: i18n.rates.editEntryDialogTitle.replace('${name}', entryData.displayname),
					dialogClass: 'rates-container rates-dialog'
				});

				if(entryData.number) {
					$('.js-number-switcher[value="number"]').prop('checked', true);
					$('.js-entry-number-box').show();
					$('.js-entry-pattern-box').hide();
				} else if(entryData.pattern) {
					$('.js-number-switcher[value="pattern"]').prop('checked', true);
					$('.js-entry-number-box').hide();
					$('.js-entry-pattern-box').show();
				}

				self.entryPopupBindEvents($popup, entryData, entryId, listId);
			});
		},

		entryPopupBindEvents: function($popup, entryData, entryId, listId) {
			var self = this;

			$('.js-number-switcher', $popup).on('change', function(e) {
				e.preventDefault();
				var val = $(this).val();

				$('.js-entry-number-box,.js-entry-pattern-box').hide();
				$('.js-entry-' + val + '-box').show();
			});

			$('.js-cancel', $popup).on('click', function(e) {
				e.preventDefault();
				$popup.dialog('close');
			});

			$('.js-save-entry', $popup).on('click', function(e) {
				e.preventDefault();

				self.saveEntryHandler($popup, entryData, entryId, listId);
			});
		},

		removeEmptyEntryProperties: function(data) {
			var propertiesList = [
				'rate_name',
				'iso_country_code',
				'description',
				'prefix',
				'rate_cost',
				'internal_rate_cost',
				'rate_increment',
				'rate_minimum',
				'direction',
				'weight',
				'rate_surcharge',
				'routes'
			];
			for(var i=0, len=propertiesList.length; i<len; i++) {
				if(!data[propertiesList[i]]) {
					delete data[propertiesList[i]];
				}
			}
			return data;
		},

		//Format necessary inputs
		formatDataEntry: function(formData){
			//Format necessary inputs
			if(formData['rate_cost']){
				formData['rate_cost'] = Number(formData['rate_cost']);
			};
			if(formData['internal_rate_cost']){
				formData['internal_rate_cost'] = Number(formData['internal_rate_cost']);
			};
			if(formData['rate_increment']){
				formData['rate_increment'] = Number(formData['rate_increment']);
			};
			if(formData['rate_minimum']){
				formData['rate_minimum'] = Number(formData['rate_minimum']);
			};
			if(formData['rate_surcharge']){
				formData['rate_surcharge'] = Number(formData['rate_surcharge']);
			};
			if(formData['direction']){
				formData['direction'] = Array(formData['direction']);
			};
			if(formData['routes']){
				formData['routes'] = Array(formData['routes']);
			};

			return formData;
		},

		saveEntryHandler: function($popup, entryData, entryId, listId){
			var self = this;
			var $entryForm = $popup.find('form');
			var newEntryData = {};

			monster.ui.validate($entryForm, {
				rules: self.validationRules.entryForm
			});

			if(!monster.ui.valid($entryForm)) {
				return;
			}

			var formData = monster.ui.getFormData($entryForm[0]);

			//Format necessary inputs
			formData['rate_cost'] = Number(formData['rate_cost']);
			formData['internal_rate_cost'] = Number(formData['internal_rate_cost']);
			formData['rate_increment'] = Number(formData['rate_increment']);
			formData['rate_minimum'] = Number(formData['rate_minimum']);
			formData['rate_surcharge'] = Number(formData['rate_surcharge']);
			formData['direction'] = Array(formData['direction']);
			formData['routes'] = Array(formData['routes']);

			if(entryId) {
				newEntryData = self.removeEmptyEntryProperties($.extend(true, entryData, formData));
				self.updateEntry(entryId, listId, newEntryData, function(updatedEntryData){
					self.updateEntryDatatableRow(entryId, updatedEntryData);
					$popup.dialog('close');
				});
			} else {
				newEntryData = self.removeEmptyEntryProperties(formData);
				self.createEntry(listId, newEntryData, function(entryData){
					self.addRowsToEntriesDatatable([entryData], listId);
					$popup.dialog('close');
				});
			}
		},
		addRowsToEntriesDatatable: function(entriesDataArr, listId, callback) {
			var self = this;
			var buttonsHtml = $(monster.template(self, 'entriesButtons', {})).html();
			var $entriesTable = $('#entries-table');

			entriesDataArr.forEach(function(val, i){
				(function(entryData){
					var rowNode = self.vars.entryDataTable.row.add([
						'',
						entryData['rate_name'] || '',
						entryData['prefix'] || '',
						entryData['rate_cost'] || '',
						entryData['surcharge'] || '',
						entryData['description'] || '',
						buttonsHtml
					] ).draw(false).node();

					$(rowNode).attr('id', entryData.id)
						.data('entry-id', entryData.id)
						.data('list-id', listId)
						.addClass('js-item');
				})(val);
			});

			if(typeof(callback) === 'function') {
				callback();
			}
		},
		updateEntryDatatableRow: function(entryId, entryData){
			var self = this;
			var $row = $('#entries-table').find('tr#' + entryId);
			var dataTablesRow = self.vars.entryDataTable.row($row);

			var rowData = dataTablesRow.data();
			rowData[1] = entryData['rate_name'] || '';
			rowData[2] = entryData['prefix'] || '';
			rowData[3] = entryData['rate_cost'] || '';
			rowData[4] =entryData['surcharge'] || '';
			rowData[5] = entryData['description'] || '';
			dataTablesRow.data(rowData);
			self.vars.entryDataTable.draw(false);
		}
	};

	return app;
});
