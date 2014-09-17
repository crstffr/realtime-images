module.exports = function (grunt) {

    /**
     * *************************************
     *
     * Load the Plugins
     *
     * *************************************
     */

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-lineending');
    grunt.loadNpmTasks('grunt-usemin');

    /**
     * *************************************
     *
     * Define all of our Grunt Tasks
     *
     * *************************************
     */

    /**
     * Task: grunt scrub
     * Iterates over all source files and converts any CRLF to LF
     */
    grunt.registerTask('scrub', [
        'lineending:source'
    ]);

    /**
     * Task: grunt rebuild
     * Compile the LESS into CSS, copy over other site assets into
     * the public directory, and then bake the templates into HTML.
     * Rebuilds the entire site from scratch
     */
    grunt.registerTask('build:dev', [
        'clean:public'
        ,'copy:css'
        ,'less:public'
        ,'copy:config'
        ,'copy:html'
        ,'copy:js'
        ,'copy:img'
        ,'copy:vendor'
    ]);

    /**
     * Task: grunt rebuild
     * Compile the LESS into CSS, copy over other site assets into
     * the public directory, and then bake the templates into HTML.
     * Rebuilds the entire site from scratch
     */
    grunt.registerTask('build:prod', [
        'useminPrepare'
        ,'concat:generated'
        ,'cssmin:generated'
        ,'uglify:generated'
        ,'usemin'
        ,'clean:tmp'
    ]);

    grunt.registerTask('build', ['build:dev', 'build:prod']);

    grunt.registerTask('default', 'watch');

    /**
     * *************************************
     *
     * Configure GRUNT to do our bidding.
     *
     * *************************************
     */
    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json')

        /**
         * Contrib-watch: file system watcher that triggers an event
         * on file changes, also triggers the livereload server.
         */
        ,watch: {
            options: {
                spawn: false,
                livereload: true
            },
            config: {
                files: ['config/config.js'],
                tasks: ['copy:config']
            },
            html: {
                files: ['source/**/*.html'],
                tasks: ['copy:html']
            },
            css: {
                files: ['source/assets/css/**/*.css'],
                tasks: ['copy:css']
            },
            less: {
                files: ['source/assets/less/*.less'],
                tasks: ['less:public']
            },
            js: {
                files: ['source/assets/js/**/*.js'],
                tasks: ['copy:js']
            },
            img: {
                files: ['source/assets/img/**/*'],
                tasks: ['copy:img']
            },
            vendor: {
                files: ['source/assets/vendor/**/*'],
                tasks: ['copy:vendor']
            }
        }

        ,useminPrepare: {
            options: {
                dest: 'public/'
            },
            public: 'public/index.html'
        }

        ,usemin: {
            html: 'public/index.html',
            options: {
                assetsDirs: ['public/assets/js','public/assets/css']
            }
        }

        /**
         * Contrib-clean: Deletes directories.
         */
        ,clean: {
            options: { force: true },
            public: {
                src: [
                    'public/**/*'
                ]
            },
            tmp: {
                src: [
                    '.tmp'
                ]
            }
        }

        /**
         * Contrib-less: Compiles LESS files into CSS files and puts
         * them in a specified destination directory.
         */
        ,less: {
            public: {
                files: [{
                    expand: true,
                    cwd: 'source/assets/less/',
                    src: ['*.less', '!_*.less'],
                    dest: 'public/assets/css/',
                    ext: '.css'
                }]
            }
        }

        /**
         * Contrib-copy: Copies files to and from directories.
         */
        ,copy: {

            config: {
                files: [
                {
                    expand: true,
                    cwd: 'config/',
                    src: ['config.js'],
                    dest: 'public/assets/js/'
                }
            ]},
            html: {
                files: [
                {
                    expand: true,
                    cwd: 'source/',
                    src: ['**/*.html'],
                    dest: 'public/'
                }
            ]},
            css: {
                files: [
                {
                    expand: true,
                    cwd: 'source/assets/css/',
                    src: ['**/*'],
                    dest: 'public/assets/css/'
                }
            ]},
            js: {
                files: [
                {
                    expand: true,
                    cwd: 'source/assets/js/',
                    src: ['**/*'],
                    dest: 'public/assets/js/'
                }
            ]},
            img: {
                files: [
                {
                    expand: true,
                    cwd: 'source/assets/img/',
                    src: ['**'],
                    dest: 'public/assets/img/'
                }
            ]},
            vendor: {
                files: [
                {
                    expand: true,
                    cwd: 'source/assets/vendor/',
                    src: ['**'],
                    dest: 'public/assets/vendor/'
                }
            ]}

        }

        /**
         * LineEnding: Converts line ending characters from CRLF to LF.
         */
        ,lineending: {
            source: {
                files: [{
                        expand: true,
                        cwd: 'source/',
                        src: ['**/*.html', '**/*.less', '**/*.js'],
                        dest: 'source/'
                }]
            },
            public: {
                files: [{
                        expand: true,
                        cwd: 'public/',
                        src: ['**/*.html', '**/*.css', '**/*.js'],
                        dest: 'public/'
                }]
            }
        }

    });

};