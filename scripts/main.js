/* Load paths for frameworks and application launcher */

require.config({
	paths: {
		/* Using AMD forks for non AMD compliant libraries */
		'text':     'library/require.text',
		'jed':      'library/jed',

		'jquery':   'library/jquery',
		'cookie':   'library/jquery.cookie',
		'jqueryui': 'library/jquery.ui',

		/* Backbone */
		'underscore':          'library/underscore',
		'backbone':            'library/backbone',
		'underscore.string':   'library/underscore.string',

		/* Marionette */
		'backbone.babysitter': 'library/backbone.babysitter',
		'backbone.wreqr':      'library/backbone.wreqr',
		'marionette':          'library/backbone.marionette',

		/* Bootstrap */
		'bootstrap': 'library/bootstrap',

		/* App Config */
		'config': 'config'
	},

	shim: {
	   'underscore.string': {
			deps: ['underscore'],
		},

        "jqueryui": {
            exports: "$",
            deps: ['jquery']
        },

		'bootstrap' : {
			deps: ['jquery']
		}
	},

	/* Visual Debugging */
	config: {
		text: {
			xrayTemplateDebugging: (typeof document !== 'undefined') ? document.URL.match(/xray-goggles/) : false
		},

		moduleLog: (typeof document !== 'undefined') ? document.URL.match(/module-log/) : false
	}
});

require(['application', 'backbone', 'marionette'], function(application, Backbone, Marionette) {
	Backbone.xrayViewDebugging = (typeof document !== 'undefined') ? document.URL.match(/xray-goggles/) : false;

	application.start();
});

