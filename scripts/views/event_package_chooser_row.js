define([
  'backbone',
  'text!templates/event_package_chooser_row.tpl',
  'models/trigger',
  'models/instance',
  'vent',
  'storage'
],
function(
  Backbone,
  Template,
  Trigger,
  Instance,
  vent,
  storage
)
{
  return Backbone.Marionette.ItemView.extend(
  {
    template: _.template(Template),

    // Bootstrap
    tagName: 'a',
    className: "list-group-item",

    events:
    {
      "click .new-instance": "onClickNewInstance",
    },

    // TODO how to bubble up? or get scene passed to us
    onClickNewInstance: function()
    {
      var trigger  = new Trigger  ({game_id: this.options.parent.get("game_id"), scene_id: this.options.parent.get("scene_id")});
      var instance = new Instance ({game_id: this.options.parent.get("game_id")});
      var eventPackage = this.model;

      // Scenes can only be immediate for now.
      trigger.set("type", "IMMEDIATE");

      // Save directly and insert into scene/show sidebar
      instance.set("object_id",   eventPackage.id);
      instance.set("object_type", Instance.type_for(eventPackage));

      instance.save({},
      {
        create: function()
        {
          storage.add_game_object(instance);

          // Save Trigger
          trigger.set("instance_id", instance.id);

          trigger.save({},
          {
            create: function()
            {
              storage.add_game_object(trigger);
              vent.trigger("application:popup:hide");
            }
          });
        }
      });
    }
  });
});

