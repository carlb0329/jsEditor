define([
	'backbone',
	'text!templates/dialog_chooser_row.tpl',
	'models/trigger',
	'models/instance',
	'vent',
	'storage'
], function(Backbone, Template, Trigger, Instance, vent, storage) {

	return Backbone.Marionette.ItemView.extend({
		template: _.template(Template),

		// Bootstrap
		tagName: 'a',
		className: "list-group-item",


		events: {
			"click .new-instance": "onClickNewInstance",
		},


		// TODO how to bubble up? or get scene passed to us
		onClickNewInstance: function() {
			var trigger  = new Trigger  ({game_id: this.options.parent.get("game_id"), scene_id: this.options.parent.get("scene_id")});
			var instance = new Instance ({game_id: this.options.parent.get("game_id")});
			var dialog   = this.model;

			// Save directly and insert into scene/show sidebar
			instance.set("object_id",   dialog.id);
			instance.set("object_type", Instance.type_for(dialog));

			instance.save({}, {
				create: function() {
					storage.instances.add(instance);

					// Save Trigger
					trigger.set("instance_id", instance.id);

					trigger.save({},
					{
						create: function()
						{
							storage.triggers.add(trigger);

							// FIXME better way to handle this?
							vent.trigger("scene:add_trigger", trigger);
							vent.trigger("application:popup:hide");
						}
					});
				}
			});
		}
	});
});

