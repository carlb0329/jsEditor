define([
  'underscore',
  'jquery',
  'backbone',
  'text!templates/trigger_editor_object_selector.tpl',
  'vent',
  'storage',
],
function(
  _,
  $,
  Backbone,
  Template,
  vent,
  storage
)
{
  return Backbone.Marionette.CompositeView.extend(
  {
    template: _.template(Template),
    templateHelpers: function()
    {
      var self = this;

      return {
        game_object: this.model.game_object(),

        attribute_items: new Backbone.Collection(storage.items.where({type: "ATTRIB"})),
        web_items:       new Backbone.Collection(storage.items.where({type: "URL"})),
        items:           new Backbone.Collection(storage.items.where({type: "NORMAL"})),
        hidden_items:    new Backbone.Collection(storage.items.where({type: "HIDDEN"})),
        plaques:         storage.plaques,
        dialogs:         storage.dialogs,
        web_pages:       storage.web_pages,
        factories:       storage.factories,
        event_packages:  storage.event_packages,
        scenes:          new Backbone.Collection(storage.scenes.filter(function(scene) { return scene !== self.model.scene(); })),

        option_selected: function(boolean_statement) { return boolean_statement ? "selected" : ""; },
      }
    },

    ui:
    {
      game_object_select: "#instance-object_id"
    },

    events:
    {
      "change @ui.game_object_select": "onChangeGameObject"
    },

    initialize: function()
    {
      var self = this;
      self.listenTo(storage.items,          "change add remove", self.render);
      self.listenTo(storage.plaques,        "change add remove", self.render);
      self.listenTo(storage.dialogs,        "change add remove", self.render);
      self.listenTo(storage.web_pages,      "change add remove", self.render);
      self.listenTo(storage.factories,      "change add remove", self.render);
      self.listenTo(storage.event_packages, "change add remove", self.render);
      self.listenTo(storage.scenes,         "change add remove", self.render);
    },

    onChangeGameObject: function()
    {
      var id   = this.ui.game_object_select.find("option:selected").val();
      var type = this.ui.game_object_select.find("option:selected").data("object-type");

      var game_object = storage.retrieve_with_type(id, type);
      this.trigger("game_object:choose", game_object);
    }

  });
});

