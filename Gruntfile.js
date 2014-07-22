module.exports = function(grunt) {
	//grunt 初始化配置
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jshint: {
			files: ['observe.js']
		},
		uglify: {
			options: {
				banner: '/* <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
			},
			min: {
				files: [{
					src: 'observe.js',
					dest: 'observe.min.js'
				}, {
					src: 'jQuery.jPlus.js',
					dest: 'jQuery.jPlus.min.js'
				}]
			}
		},
		watch: {
			files: ['<%= uglify.min.files[0].src %>', '<%= uglify.min.files[1].src %>'],
			tasks: 'uglify'
		}
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['uglify', 'watch']);
};