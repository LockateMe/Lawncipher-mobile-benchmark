module.exports = function(grunt){

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		meta: {
			banner: '/*! <%= pkg.name || pkg.title %> - v<%= pkg.version %> - <%= grunt.template.today("dd-mm-yyyy") %>\n' +
			'<%= pkg.homepage ? "* " + pkg.homepage : ""%>\n' +
			'* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>;\n' +
			'* License: <%= pkg.license %>\n' +
			'* GENERATED FILE. DO NOT EDIT.\n' +
			'*/\n\n'
		},
		concat: {
			dist: {
				options: {
					banner: '<%= meta.banner %>'
				},
				src: [
					'src/chrono.js',
					'src/dbwrapper.js',
					'src/dbwrappers/lawncipher_wrapper.js',
					'src/dbwrappers/pouch_wrapper.js',
					'src/workload.js',
					'src/workloads/readwrite.js',
					'src/workloads/mostlyread.js',
					'src/workloads/mostlyinsert.js',
					'src/workloads/mostlyquery.js',
					'src/workloads/readonly.js',
					'src/workloads/queryonly.js',
					'src/workloads/mixed.js',
					'src/workloads/collectionSizeStress.js',
					'src/workloads/massiveBlobInsertion.js',
					'src/index.js'
				],
				dest: 'www/js/benchmarks.js'
			},
			zepto: {
				src: [
					'bower_components/zepto/src/zepto.js',
					'bower_components/zepto/src/event.js',
					'bower_components/zepto/src/ajax.js',
					'bower_components/zepto/src/form.js',
					'bower_components/zepto/src/assets.js',
					'bower_components/zepto/src/detect.js',
					'bower_components/zepto/src/touch.js',
					'bower_components/zepto/src/gesture.js',
					'bower_components/zepto/src/selector.js'
				],
				dest: 'www/js/zepto.js'
			}
		},
		jsvalidate: {
			options: {
				globals: {},
				esprimaOptions: {},
				verbose: true
			},
			src: ['src/**/*.js']
		}
	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-jsvalidate');

	grunt.registerTask('default', ['jsvalidate', 'concat']);

};
