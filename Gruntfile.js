module.exports = function(grunt) {
	//grunt 初始化配置
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jshint: {
			files: ['observe.js']
		},
		concat: {
			files: {
				src: ['src/intro.js', 'src/base.js', 'src/observe.js', 'src/outro.js'],
				dest: 'dist/observe.js'
			}
		},
		uglify: {
			options: {
				banner: '/* <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
			},
			min: {
				files: [{
					src: 'dist/observe.js',
					dest: 'dist/observe.min.js'
				}]
			}
		},
		watch: {
			files: ['<%= concat.files.src %>'],
			tasks: ['concat', 'uglify']
		}
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['concat', 'uglify', 'watch']);
};