
plugins/cordova-plugin-file-node-like:
	cordova plugin add cordova-plugin-file-node-like

plugins/cordova-plugin-scrypt:
	cordova plugin add cordova-plugin-scrypt

plugins/done: plugins/cordova-plugin-file-node-like plugins/cordova-plugin-scrypt
	touch plugins/done

update-plugins:
	-rm plugins/done
	make plugins/done

platforms/ios:
	cordova platform add ios

platforms/android:
	cordova platform add android
