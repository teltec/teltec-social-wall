(function(){
	"use strict";

	module.exports = function(grunt) {

		grunt.initConfig({
			jshint: {
				files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
				options: {
					globals: {
						jQuery: true
					}
				}
			},
			watch: {
				files: ['<%= jshint.files %>', 'node_modules/', 'bower_components/'],
				tasks: ['jshint', 'copy']
			},
			copy: {
				main: {
					files: [
						{
							flatten: true,
							expand: true,
							src: ['node_modules/moment/min/moment-with-locales.min.js'],
							dest: 'public/3rd/moment/',
						},
						{
							flatten: true,
							expand: true,
							src: [
								'bower_components/bootstrap/dist/css/*',
								'bower_components/bootstrap/dist/js/*',
								'bower_components/bootstrap/dist/fonts/*',

							],
							dest: 'public/3rd/bootstrap/',
						},
						{
							flatten: true,
							expand: true,
							src: [
								'bower_components/jquery/dist/jquery.min.*',
								'bower_components/jquery/sizzle/dist/sizzle.min.*',
							],
							dest: 'public/3rd/jquery/',
						},
						{
							flatten: true,
							expand: true,
							src: ['bower_components/underscore/underscore-min.*'],
							dest: 'public/3rd/underscore/',
						},
					],
				},
			}
		});

		grunt.loadNpmTasks('grunt-contrib-jshint');
		grunt.loadNpmTasks('grunt-contrib-watch');
		grunt.loadNpmTasks('grunt-contrib-copy');

		grunt.registerTask('default', ['jshint', 'copy']);
	};
})();