pre-build: copy-bower-components
	grunt

copy-bower-components: bower_components/lawncipher bower_components/libsodium.js bower_components/pouchdb
	cp bower_components/lawncipher/lawncipher.js www/js/
	cp bower_components/pouchdb/dist/pouchdb.min.js www/js/pouchdb.js
	cp bower_components/libsodium.js/dist/browsers/combined/sodium.min.js www/js/sodium.js

bower_components/lawncipher:
	bower install lawncipher

bower_components/libsodium.js:
	bower install libsodium.js

bower_components/pouchdb:
	bower install pouchdb

plugins/cordova-plugin-file-node-like:
	cordova plugin add cordova-plugin-file-node-like

plugins/cordova-plugin-scrypt:
	cordova plugin add cordova-plugin-scrypt

plugins/cordova-sqlite-storage:
	cordova plugin add cordova-sqlite-storage

plugins/com.couchbase.lite.phonegap:
	cordova plugin add https://github.com/couchbaselabs/Couchbase-Lite-PhoneGap-Plugin.git

plugins/done: plugins/cordova-plugin-file-node-like plugins/cordova-plugin-scrypt plugins/cordova-sqlite-storage plugins/com.couchbase.lite.phonegap
	touch plugins/done

update-plugins:
	-rm plugins/done
	make plugins/done

platforms/ios: plugins/done
	cordova platform add ios@4.1.1

platforms/android: plugins/done
	cordova platform add android@5.1.1

ios: platforms/ios pre-build
	cordova -d build ios

android: platforms/android pre-build
	cordova -d build android

run-ios: platforms/ios pre-build
	cordova -d run ios

run-android: platforms/android pre-build
	cordova -d run android
