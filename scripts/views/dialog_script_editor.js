define([
  'underscore',
  'backbone',
  'text!templates/dialog_script_editor.tpl',
  'collections/events',
  'collections/items',
  'models/event_package',
  'models/game',
  'models/dialog_option',
  'views/event_package_editor',
  'storage',
  'vent',
],
function(
  _,
  Backbone,
  Template,
  EventsCollection,
  ItemsCollection,
  EventPackage,
  Game,
  DialogOption,
  EventPackageEditorView,
  storage,
  vent
)
{
  return Backbone.Marionette.ItemView.extend({

    template: _.template(Template),

    templateHelpers: function()
    {
      return {
        is_new: this.model.isNew(),

        option_selected: function(boolean_statement)
        {
          return boolean_statement ? "selected" : "";
        },

        characters: this.characters
      }
    },

    initialize: function(options)
    {
      this.characters = options.characters;
      this.scripts = options.scripts;
      this.script_options = options.script_options;
      this.instance_parent_option = options.instance_parent_option;

      // Undo abilities for cancel button
      //
      this.previous_attributes = _.clone(this.model.attributes)

      // Render when new characters created on left
      //
      this.characters.on("add", this.render);
    },

    onRender: function()
    {
      this.$el.find('[data-toggle="popover"]').popover({trigger: 'hover',placement: 'top', delay: 400 });
    },

    ui: {
      text: ".text",
      character: ".character"
    },

    events: {
      "change @ui.text":      "onChangeText",
      "change @ui.character": "onChangeCharacter",
      "click .save":          "onClickSave",
      "click .cancel":        "onClickCancel",
      "click .edit-events":   "onClickEditEvents",
      "click .delete":        "onClickDelete"
    },

    onChangeText: function()
    {
      this.model.set("text", this.ui.text.val());
    },

    onChangeCharacter: function()
    {
      var value = this.ui.character.find("option:selected").val();
      this.model.set("dialog_character_id", value);
    },

    onClickSave: function()
    {
      this.model.save({}, {
        success: function()
        {
          vent.trigger("conversation:update");
          vent.trigger("application:info:hide");
        }
      });
    },

    onClickCancel: function()
    {
      delete this.previous_attributes.event_package_id;
      this.model.set(this.previous_attributes);
      vent.trigger("application:info:hide");
    },

    onClickEditEvents:function()
    {
      var self = this;

      var game = new Game({game_id:self.model.get("game_id")});

      var event_package;
      if(self.model.get("event_package_id") == 0) event_package = new EventPackage({game_id:game.id});
      else                                        event_package = new EventPackage({game_id:game.id, event_package_id:self.model.get("event_package_id")});
      var events = new EventsCollection([], {parent:event_package});

      var items  = new ItemsCollection([], {parent:game});

      $.when(
        items.fetch(),
        event_package.fetch(),
        events.fetch()
      ).done(
        function()
        {
          if(self.model.get("event_package_id") == 0)
          {
            event_package.save({},
            {
              success:function()
              {
                storage.add_game_object(event_package);
                self.model.set("event_package_id", event_package.id);
                self.model.save({}, {
                  create:function()
                  {
                    storage.add_game_object(self.model);
                  }
                });
                var events_editor = new EventPackageEditorView({model:event_package, collection:events, items:items});
                vent.trigger("application:popup:show", events_editor, "Player Modifier");
              }
            });
          }
          else
          {
            self.model.save({}, {});
            var events_editor = new EventPackageEditorView({model:event_package, collection:events, items:items});
            vent.trigger("application:popup:show", events_editor, "Player Modifier");
          }

        }
      );
    },

    onClickDelete: function()
    {
      if(!this.instance_parent_option) return; //actually should do something else
      var view = this;

      var copied_child_options = [];
      var current_child_options = view.script_options.where({parent_dialog_script_id:view.model.get("dialog_script_id")});
      for(var i = 0; i < current_child_options.length; i++) {
        copied_child_options[i] = new DialogOption();
        copied_child_options[i].set("game_id",    current_child_options[i].get("game_id"));
        copied_child_options[i].set("dialog_id",  current_child_options[i].get("dialog_id"));
        copied_child_options[i].set("link_type",  current_child_options[i].get("link_type"));
        copied_child_options[i].set("link_id",    current_child_options[i].get("link_id"));
        copied_child_options[i].set("prompt",     current_child_options[i].get("prompt"));
        copied_child_options[i].set("sort_index", current_child_options[i].get("sort_index"));
        copied_child_options[i].set("parent_dialog_script_id", view.instance_parent_option.get("parent_dialog_script_id"));
      }

      //poor man's map
      function saveRemainingChildOptions()
      {
        if(copied_child_options.length > 0) {
          copied_child_options[0].save({}, {
            success: function()
            {
              view.script_options.push(copied_child_options[0]);
              copied_child_options.splice(0,1);
              saveRemainingChildOptions();
            }
          });
        }
        else {
          view.script_options.remove(view.instance_parent_option);
          view.instance_parent_option.destroy({
            success: function()
            {
              vent.trigger("conversation:update");
              vent.trigger("application:info:hide");
            }
          });
        }
      }

      saveRemainingChildOptions();
      return false;
    },

    onClickDeleteAll: function()
    {
      var child_options = this.script_options.where({parent_dialog_script_id:this.model.get("dialog_script_id")});
      for(var i = 0; i < child_options.length; i++)
      {
        this.script_options.remove(child_options[i]);
        child_options[i].destroy();
      }

      var parent_options = this.script_options.where({link_type:"DIALOG_SCRIPT", link_id:this.model.get("dialog_script_id")});
      for(var i = 0; i < parent_options.length; i++) //should actually only be one
      {
        this.script_options.remove(parent_options[i]);
        parent_options[i].destroy();
      }

      this.scripts.remove(this.model);
      this.model.destroy({
        success: function()
        {
          vent.trigger("conversation:update");
          vent.trigger("application:info:hide");
        }
      });
    }

  });
});
