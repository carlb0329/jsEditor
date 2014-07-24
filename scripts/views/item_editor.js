define([
	'underscore',
	'jquery',
	'backbone',
	'text!templates/item_editor.tpl',
	'collections/media',
	'models/game',
	'views/media_chooser',
	'vent'
], function(_, $, Backbone, Template, MediaCollection, Game, MediaChooserView, vent) {

	return Backbone.Marionette.CompositeView.extend({
		template: _.template(Template),

		templateHelpers: function()
		{
			return {
				is_new: this.model.isNew(),
				icon_thumbnail_url:  this.icon.get("thumb_url"),
				media_thumbnail_url: this.media.get("thumb_url"),

				is_checked: function(value)
				{
					return value === "1" ? "checked" : "";
				},

				radio_selected: function(boolean_statement) {
					return boolean_statement ? "checked" : "";
				},
			}
		},


		ui:
		{
			"name":         "#item-name",
			"description":  "#item-description",
			"url":          "#item-url",
			"droppable":    "#item-droppable",
			"destroyable":  "#item-destroyable",
			"weight":       "#item-weight",

			"iconchooser":  "#icon-chooser-container",
			"mediachooser": "#media-chooser-container",

			"max_qty_in_inventory": "#item-max_qty_in_inventory"
		},

		onShow: function()
		{
			this.onChangeType();

			this.$el.find('input[autofocus]').focus();
		},


		events:
		{
			"click .save": "onClickSave",
			"click .change-icon":  "onClickChangeIcon",
			"click .change-media": "onClickChangeMedia",
			"change input[name='item-type']": "onChangeType"
		},

		initialize: function(options)
		{
			this.icon  = options.icon;
			this.media = options.media;
		},

		onClickSave: function()
		{
			var view   = this;
			var item = this.model;

			// Save Object
			item.set("icon_media_id", view.icon.get("media_id"));
			item.set("media_id",      view.media.get("media_id"));
			item.set("name",          view.ui.name.val());
			item.set("description",   view.ui.description.val());
			item.set("url",           view.ui.url.val());
			item.set("weight",        view.ui.weight.val());
			item.set("droppable",     view.ui.droppable.is(":checked") ? "1" : "0");
			item.set("destroyable",   view.ui.destroyable.is(":checked") ? "1" : "0");
			item.set("type",          view.$el.find("input[name=item-type]:checked").val());

			item.set("max_qty_in_inventory", view.ui.max_qty_in_inventory.val());

			item.save({}, {
				success: function()
				{
					// FIXME get rid of global update broadcasts for models
					vent.trigger("item:update", item);
					vent.trigger("application:dialog:hide");
				}
			});
		},


		/* Radio Button field logic */

		onChangeType: function()
		{
			var view = this;

			// Hide radio buttons and add bootstrap classes
			//
			var selected_radio = this.$el.find("input[name=item-type]:checked");

			this.$el.find("input[name=item-type]").parent().removeClass("active");
			selected_radio.parent().addClass("active");


			// Hide all and open selected tab
			//
			this.$el.find('.trigger-tab').hide();

			var display_tab = "." + selected_radio.val() + "-fields";
			$(display_tab).show();

			// Assign value in-case view is re-rendered
			this.model.set("type", selected_radio.val());
		},


		/* Media Selectors */

		onClickChangeIcon: function()
		{
			var view = this;

			var game  = new Game({game_id: this.model.get("game_id")});
			var media = new MediaCollection([], {parent: game});

			media.fetch({
				success: function()
				{
					var icon_chooser = new MediaChooserView({collection: media, el: view.ui.iconchooser});
					icon_chooser.render();

					icon_chooser.on("media:choose", function(media) {
						view.icon = media;
						view.render();
						view.onChangeType();
					});
				}
			});
		},

		onClickChangeMedia: function()
		{
			var view = this;

			var game  = new Game({game_id: this.model.get("game_id")});
			var media = new MediaCollection([], {parent: game});

			media.fetch({
				success: function()
				{
					var media_chooser = new MediaChooserView({collection: media, el: view.ui.mediachooser});
					media_chooser.render();

					media_chooser.on("media:choose", function(media)
					{
						view.media = media;
						view.render();
						view.onChangeType();
					});
				}
			});
		}

	}); /* class */
}); /* define */