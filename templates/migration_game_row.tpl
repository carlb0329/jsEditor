<div class="media <%= migration_count > 0 ? "previously_migrated" : "" %>">
	<div class="media-left">
		<img class="media-object tiny" src=<%= icon_thumb_url %>>
	</div>
	<div class="media-body">
		<h4 class="media-heading">
			<%= name || "Game "+game_id %>
		</h4>
		<div class="description">
			<%= _.str.prune(description, 100) %>
		</div>
	</div>
	<div class="media-right media-middle">
		<% if(migrating === "true") { %>
			<span class="migrating-badge"><span class="glyphicon glyphicon-time"></span></span>
		<% } else if(migration_count > 0) { %>
			<span class="migrated-badge">Imported</span>
		<% } %>
	</div>
</div>

