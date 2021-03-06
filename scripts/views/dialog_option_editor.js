define([
  'underscore',
  'underscore.string',
  'backbone',
  'text!templates/dialog_option_editor.tpl',
  'views/requirements',
  'views/alert_dialog',
  'models/requirement_package',
  'models/game',
  'collections/and_packages',
  'collections/atoms',
  'collections/items',
  'collections/tags',
  'collections/plaques',
  'collections/dialogs',
  'collections/game_dialog_scripts',
  'collections/web_pages',
  'collections/quests',
  'collections/web_hooks',
  'storage',
  'vent',
],
function(
  _,
  _S,
  Backbone,
  Template,
  RequirementsEditorView,
  AlertDialog,
  RequirementPackage,
  Game,
  AndPackagesCollection,
  AtomsCollection,
  ItemsCollection,
  TagsCollection,
  PlaquesCollection,
  DialogsCollection,
  DialogScriptsCollection,
  WebPagesCollection,
  QuestsCollection,
  WebHooksCollection,
  storage,
  vent
)
{
  return Backbone.Marionette.ItemView.extend({

    template: _.template(Template),


    initialize: function(options)
    {
      //These are essentially the classes, not actual properties (can't include via require- circular reqs)
      this.DialogScript = options.DialogScript;
      this.DialogOption = options.DialogOption;

      this.dialog = options.dialog;
      this.scripts = options.scripts;
      this.script_options = options.script_options;

      this.plaques   = storage.plaques;
      this.items     = storage.items;
      this.web_pages = storage.web_pages;
      this.dialogs   = storage.dialogs;
      this.tabs      = storage.tabs;

      this.previous_attributes = _.clone(this.model.attributes)
    },

    templateHelpers: function()
    {
      var self = this;
      return {
        is_new: self.model.isNew(),

        option_selected: function(boolean_statement) { return boolean_statement ? "selected" : ""; },
        link_types: self.link_types,

        //Function that will escape special characters like quotes.
        //Specifically for rendering in the web view for editing a prompt
        escaped_prompt:  function(text) {
        	  var characters = {
        	    '&': '&amp;',
        	    '"': '&quot;',
        	    "'": '&#039;',
        	    '<': '&lt;',
        	    '>': '&gt;'
        	  };
        	  return (text + "").replace(/[<>&"']/g, function(m){
        	    return characters[m];
        	  });
        	},

        strip_js: function(html)
        {
          var div = document.createElement('div');
          div.innerHTML = html;

          var scripts = div.getElementsByTagName('script');
          for(var i = scripts.length-1; i >= 0; i--)
            scripts[i].parentNode.removeChild(scripts[i]);

          var styles = div.getElementsByTagName('style');
          for(var i = styles.length-1; i >= 0; i--)
            styles[i].parentNode.removeChild(styles[i]);

          return div.textContent || div.innerText;
        },
        	
        scripts: self.scripts,
        speakerfromscriptid: function(id)
        {
          var script = storage.dialog_scripts.findWhere({"dialog_script_id":id});
          if(script.get("dialog_character_id") == "0") return "You";
          var charac = storage.dialog_characters.findWhere({"dialog_character_id":script.get("dialog_character_id")});
          return charac.get("name");
        },

        // game objects for option menu
        plaques:   self.plaques,
        items:     self.items,
        web_pages: self.web_pages,
        dialogs:   self.dialogs,
        tabs:      self.tabs,

        link_options_visible: self.model.get("link_type") !== "EXIT",

        link_scripts:   self.model.get("link_type") === "DIALOG_SCRIPT",
        link_plaques:   self.model.get("link_type") === "EXIT_TO_PLAQUE",
        link_items:     self.model.get("link_type") === "EXIT_TO_ITEM",
        link_web_pages: self.model.get("link_type") === "EXIT_TO_WEB_PAGE",
        link_dialogs:   self.model.get("link_type") === "EXIT_TO_DIALOG",
        link_tabs:      self.model.get("link_type") === "EXIT_TO_TAB"
      }
    },

    ui: {
      link_type: ".link-type",
      link_id:   ".link-id",
      prompt:    ".prompt"
    },

    events:
    {
      "change @ui.link_type":     "onChangeLinkType",
      "change @ui.link_id":       "onChangeLinkId",
      "change @ui.prompt":        "onChangePrompt",
      "click .save":              "onClickSave",
      "click .cancel":            "onClickCancel",
      "click .edit-requirements": "onClickEditRequirements",
      "click .delete":            "onClickDelete",
    },

    link_types:
    {
      'DIALOG_SCRIPT':    "Say Line",
      'EXIT':             "End Conversation",
      'EXIT_TO_PLAQUE':   "Exit to Plaque",
      'EXIT_TO_ITEM':     "Exit to Item",
      'EXIT_TO_WEB_PAGE': "Exit to Web Page",
      'EXIT_TO_DIALOG':   "Exit to Conversation",
      'EXIT_TO_TAB':      "Exit to Tab"
    },

    onChangeLinkType: function()
    {
      var value = this.ui.link_type.find("option:selected").val();
      this.model.set("link_type", value);

      // 0 out link ID before re-rendering sub select
      this.model.set("link_id", "0");
      this.render();
    },

    onChangeLinkId: function()
    {
      var value = this.ui.link_id.find("option:selected").val();
      this.model.set("link_id", value);
    },

    onChangePrompt: function()
    {
      this.model.set("prompt", this.ui.prompt.val());
    },

    onClickSave: function()
    {
      var view = this;

      if(this.model.get("link_type") == "DIALOG_SCRIPT" && this.model.get("link_id") == 0) {
        //create new script, set link id to that script

        var script = new view.DialogScript();
        script.set("game_id",view.model.get("game_id"));
        script.set("dialog_id",view.model.get("dialog_id"));
        script.set("text","Hello");
        script.save({}, {
          success: function()
          {
            view.scripts.push(script);

            var option = new view.DialogOption();
            option.set("game_id",view.model.get("game_id"));
            option.set("dialog_id",view.model.get("dialog_id"));
            option.set("parent_dialog_script_id",script.get("dialog_script_id"));
            option.set("link_type","EXIT");
            option.set("prompt","Exit");

            option.save({}, {
              success:function()
              {
                view.script_options.push(option);

                view.model.set("link_type","DIALOG_SCRIPT");
                view.model.set("link_id",script.get("dialog_script_id"));

                view.model.save({}, {
                  success:function()
                  {
                    vent.trigger("conversation:update");
                    vent.trigger("application:info:hide");
                  }
                });
              }
            });
          }
        });
      }
      else {
        this.model.save({}, {
          success: function()
          {
            vent.trigger("conversation:update");
            vent.trigger("application:info:hide");
          }
        });
      }
    },

    onClickCancel: function()
    {
      delete this.previous_attributes.requirement_root_package_id;
      this.model.set(this.previous_attributes);
      vent.trigger("application:info:hide");
    },

    onClickEditRequirements: function()
    {
      var view = this;

      var requirement_package = new RequirementPackage({requirement_root_package_id: view.model.get("requirement_root_package_id"), game_id: view.model.get("game_id")});

      var game = new Game({game_id: view.model.get("game_id")});

      var contents = {
        items:          new ItemsCollection         ([], {parent: game}),
        tags:           new TagsCollection          ([], {parent: game}),
        plaques:        new PlaquesCollection       ([], {parent: game}),
        dialogs:        new DialogsCollection       ([], {parent: game}),
        dialog_scripts: new DialogScriptsCollection ([], {parent: game}),
        web_pages:      new WebPagesCollection      ([], {parent: game}),
        quests:         new QuestsCollection        ([], {parent: game}),
        hooks:          new WebHooksCollection      ([], {parent: game})
      };
      contents.event_packages = storage.event_packages;

      if(requirement_package.id === "0") { requirement_package.fetch = function() {}; }

      $.when(
        contents.items.fetch(),
        contents.tags.fetch(),
        contents.plaques.fetch(),
        contents.dialogs.fetch(),
        contents.dialog_scripts.fetch(),
        contents.web_pages.fetch(),
        contents.quests.fetch(),
        contents.hooks.fetch(),
        requirement_package.fetch()
      ).done(function()
      {
        // Load associations into collections
        var and_packages = new AndPackagesCollection(requirement_package.get("and_packages"));
        requirement_package.set("and_packages", and_packages);

        and_packages.each(function(and_package)
        {
          var atoms = new AtomsCollection(and_package.get("atoms"));
          and_package.set("atoms", atoms);
        });

        // launch editor
        var requirements_editor = new RequirementsEditorView({model: requirement_package, collection: and_packages, contents: contents});

        requirements_editor.on("cancel", function()
        {
          vent.trigger("application:popup:hide");
        });

        requirements_editor.on("requirement_package:save", function(requirement_package)
        {
          view.model.set("requirement_root_package_id", requirement_package.id);

          if(view.model.hasChanged("requirement_root_package_id"))
          {
            // Quicksave if moving from 0 so user has consistent experience
            view.model.save({"requirement_root_package_id": requirement_package.id}, {patch: true});
          }

          vent.trigger("application:popup:hide");
        });

        vent.trigger("application:popup:show", requirements_editor, "Locks Editor");
      });
    },

findCascadingScriptDeletesFromPruningOption: function()
                                             {
                                               var view = this;
                                               //Set up regular old arrays of nodes/edges
                                               var opts       = []; for(var i = 0; i < view.script_options.length; i++) { opts[i] = view.script_options.at(i); } //opts array for iteration
                                               var scripts    = []; for(var i = 0; i < view.scripts.length;        i++) { scripts[i] = view.scripts.at(i); } //scripts array for iteration
                                               var scriptmap  = []; for(var i = 0; i < scripts.length;             i++) { scriptmap[parseInt(scripts[i].get("dialog_script_id"))] = scripts[i]; } //scripts map for access

                                               var vmap = []; for(var i = 0; i < scripts.length; i++) { vmap[parseInt(scripts[i].get("dialog_script_id"))] = false; } //visited map

                                               //traverse tree, marking vmap
                                               var parents = [scriptmap[parseInt(view.dialog.get("intro_dialog_script_id"))]];
                                               var children;
                                               while(parents.length > 0)
                                               {
                                                 //mark visited
                                                 vmap[parseInt(parents[0].get("dialog_script_id"))] = true;

                                                 //find children
                                                 children = [];
                                                 for(var i = 0; i < opts.length; i++) if(parseInt(opts[i].get("parent_dialog_script_id")) == parseInt(parents[0].get("dialog_script_id"))) children.push(opts[i]);

                                                 for(var i = 0; i < children.length; i++)
                                                 {
                                                   //add children scripts to be visited iff
                                                   if(children[i].get("link_type") == "DIALOG_SCRIPT" && //link type is script (duh)
                                                       parseInt(children[i].get("dialog_option_id")) != parseInt(view.model.get("dialog_option_id")) && //and option ISN'T option to be deleted (THIS option)
                                                       !vmap[parseInt(scriptmap[parseInt(children[i].get("link_id"))].get("dialog_script_id"))]) //and script not yet visited
                                                     parents.push(scriptmap[parseInt(children[i].get("link_id"))]);
                                                 }

                                                 parents.splice(0,1);
                                               }

                                               var TBD = []; //To Be Deleted (caps cuz important)
                                               for(var i = 0; i < scripts.length; i++) if(!vmap[parseInt(scripts[i].get("dialog_script_id"))]) TBD.push(scripts[i]);

                                               //for(var i = 0; i < TBD.length; i++) console.log("Q'd4Delete: "+TBD[i].get("dialog_script_id"));


                                               return TBD;
                                             },

findOptionlessScripts: function()
                       {
                         var view = this;
                         //Find option-less scripts and give them an exit option
                         var opts       = []; for(var i = 0; i < view.script_options.length; i++) { opts[i] = view.script_options.at(i); } //opts array for iteration
                         var scripts    = []; for(var i = 0; i < view.scripts.length;        i++) { scripts[i] = view.scripts.at(i); } //scripts array for iteration

                         var cmap = []; for(var i = 0; i < scripts.length; i++) { cmap[parseInt(scripts[i].get("dialog_script_id"))] = 0; } //children count map

                         for(var i = 0; i < opts.length; i++) cmap[parseInt(opts[i].get("parent_dialog_script_id"))]++;

                         var TBA = []
                           for(var i = 0; i < scripts.length; i++) if(cmap[parseInt(scripts[i].get("dialog_script_id"))] == 0) TBA.push(scripts[i]);

                         //for(var i = 0; i < TBA.length; i++) console.log("Q'd4AddExit: "+TBA[i].get("dialog_script_id"));

                         return TBA;
                       },

    onClickDelete: function()
    {
      var view = this;

      var TBD = view.findCascadingScriptDeletesFromPruningOption();
      if(TBD.length > 0) {
        var alert_dialog = new AlertDialog({text: "Deleting this option will result in the permanent deletion of <b>"+TBD.length+"</b> lines. Continue?", danger_button: true });

        alert_dialog.on("danger", function()
        {
          vent.trigger("application:popup:hide");
          view.script_options.remove(view.model);
          view.model.destroy({
            success: function()
            {
              vent.trigger("conversation:update");
              vent.trigger("application:info:hide");
            }
          });
          for(var i = 0; i < TBD.length; i++)
          {
            view.scripts.remove(TBD[i]);
            TBD[i].destroy();
          }

          var TBA = view.findOptionlessScripts();
          for(var i = 0; i < TBA.length; i++)
          {
            var option = new view.DialogOption();
            option.set("game_id",view.model.get("game_id"));
            option.set("dialog_id",view.model.get("dialog_id"));
            option.set("parent_dialog_script_id",TBA[i].get("dialog_script_id"));
            option.set("link_type","EXIT");
            option.set("prompt","Exit");
            option.save({}, {
              success:function()
              {
                view.script_options.push(option);
                vent.trigger("conversation:update");
              }
            });
          }
        });

        vent.trigger("application:popup:show", alert_dialog, "Delete Lines");
      }
      else {
        view.script_options.remove(view.model);
        view.model.destroy({
          success: function()
          {
            vent.trigger("conversation:update");
            vent.trigger("application:info:hide");
          }
        });

        var TBA = view.findOptionlessScripts();
        for(var i = 0; i < TBA.length; i++)
        {
          var option = new view.DialogOption();
          option.set("game_id",view.model.get("game_id"));
          option.set("dialog_id",view.model.get("dialog_id"));
          option.set("parent_dialog_script_id",TBA[i].get("dialog_script_id"));
          option.set("link_type","EXIT");
          option.set("prompt","Exit");
          option.save({}, {
            success:function()
            {
              view.script_options.push(option);
              vent.trigger("conversation:update");
            }
          });
        }
      }

    }

  });
});
