var tags = new Tags([
  new Tag({name: 'foo'}),
  new Tag({name: 'bar'})
]);
var tagEditorView = new TagEditorView({collection: tags});
$('#container').append(tagEditorView.render().el);
