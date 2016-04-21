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
					'src/dbwrapper.js',
					'src/workload.js',
					'src/workloads.js',
					'src/workloadRunner.js',
					'src/index.js'
				],
				dest: 'www/js/benchmarks.js'
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
