# Monster UI Rates (Cloudbased Rates GUI)

The Rates app allows you to set ratedeck via web application

Requires [Monster UI v.4.3](https://github.com/2600hz/monster-ui)

#### Manual installation (to compiled files):
1. Upload all folders and files to root directory of your Monster UI (*near the folders "apps", "css" and "js"*)
2. Register the rates app
```bash
# sup crossbar_maintenance init_app PATH_TO_RATES_DIRECTORY API_ROOT
# The Kazoo user should be able to read files from rates app directory
sup crossbar_maintenance init_app /var/www/html/monster-ui/apps/rates https://site.com:8000/v2/
```
3. Activate Callcenter app in the Monster UI App Store ( `/#/apps/appstore` )
