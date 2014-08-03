<form class="form object-editor" role="form" onsubmit="return false;">
	<!-- WebPage attributes -->

	<div class="row">
		<div class="col-xs-6 padded">
			<h4 style="float:right; width: 3em; text-align: right; margin-top: 0;">
				<span class="object-id text-muted"><%= is_new ? "" : web_page_id %></span>
			</h4>
			<div class="form-group">
				<label for="web_page-name">Name</label>
				<input type="text" autofocus class="form-control" id="web_page-name" placeholder="Name" value="<%= name %>">
			</div>

			<div class="form-group">
				<label for="web_page-url">URL</label>
				<input type="text" class="form-control" id="web_page-url" placeholder="URL" value="<%= url %>">
			</div>
		</div>

		<div class="col-xs-6 padded">
			<div class="thumbnail change-icon">
				<img src=<%= icon_thumbnail_url %>>
			</div>
		</div>
	</div>

	<div class="row">
		<div class="col-xs-6 padded">
			<button type="submit" class="btn btn-primary save">
				Save
			</button>
			<button type="button" class="btn btn-default" data-dismiss="modal">
				Cancel
			</button>
		</div>


		<div class="col-xs-6 padded">
			<button type="button" class="btn btn-info btn-block change-icon">
				<span class="glyphicon glyphicon-picture"></span>
				Select Icon
			</button>
		</div>
	</div>
</form>
