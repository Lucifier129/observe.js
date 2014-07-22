module	.exports = function(grunt) {
	//grunt 初始化配置
	grunt.initConfig({
		jshint: {
			files: ['observe.js']
		},
		uglify: {
			dist: {
				src: ['observe.js'],
				dest: 'observe.min.js'
			}
		},
		watch: {
		  files: '<%= uglify.dist.src %>',
		  tasks: 'uglify'
		}
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['uglify', 'watch']);
};