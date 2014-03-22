var Tag = Backbone.Model.extend();

var TagItemView = Backbone.View.extend({
  className: "tag-editor-tag",
  template: _.template('<div class="tag-editor-text"><%= name %></div>' + 
      '<a class="tag-editor-delete">x</a>'),
  events: {
    'click .tag-editor-delete': 'deleteTag'
  },
  initialize: function() {
    this.listenTo(this.model, 'change', this.render);
    this.listenTo(this.model, 'destroy', this.remove);
  },
  render: function() {
    var html = this.template(this.model.toJSON());
    this.$el.html(html);
    return this;
  },
  deleteTag: function(e) {
    this.model.destroy();
  }
});

var Tags = Backbone.Collection.extend({
  model: Tag
});

var TagEditorView = Backbone.View.extend({
  separator: /[, ]+/,
  initialize: function(options) {
    this.width = options.width;
    this.itemViews = _.map(this.collection.models, function(model) {
      return new TagItemView({model: model});
    });
    this.tagInput = Backbone.$('<input class="tag-editor-input">').css('width', 0);
    this.tagMeasure = (new TagItemView({model: new Tag({name: ""})})).render().$el;
    this.tagMeasure.css({position: 'absolute', left: "-999px"});
    this.textMeasure = this.tagMeasure.find('.tag-editor-text');
    this.listenTo(this.collection, 'add', this.onAddModel);
    this.listenTo(this.collection, 'remove', this.onRemoveModel);
  },
  className: 'tag-editor-field',
  events: {
    click: 'onClick',
    'focus .tag-editor-input': 'onInputFocus',
    'blur .tag-editor-input': 'onInputBlur',
    'keydown .tag-editor-input': 'onInputKeydown',
    'keyup .tag-editor-input': 'onInputKeyup'
  },
  onClick: function() {
    this.tagInput.focus();
  },
  onAddModel: function(model, collection, options) {
    this.$el.children('div:nth-child(' + (options.at + 1) + ')').after(
        new TagItemView({model: model}).render().el);
  },
  onRemoveModel: function(model, collection, options) {
    this.itemViews.splice(options.index, 1);
  },
  onInputFocus: function() {
    this.tagInput.css('font', this.textMeasure.css('font'));
  },
  onInputBlur: function() {
    this.mayInsertTags();
  },
  onInputKeydown: function(e) {
    var val = this.tagInput.val(), collection = this.collection;
    if (!val && e.which == 8 /* Backspace */ && collection.length) {
      e.preventDefault();
      collection.pop().destroy();
      this.tagInput.focus();
    }
  },
  onInputKeyup: function() {
    var val = this.tagInput.val();
    if (this.separator.test(val)) {
      this.mayInsertTags();
    } else {
      this.adjustInputWidth(val);
    }
  },
  adjustInputWidth: function(val) {
    var that = this;
    // To avoid juggling of input widths, we measure text width
    // with two more characters.  We use 'W' here because it is
    // a wide character.
    this.textMeasure.text(val + 'WW');
    setTimeout(function() {
      that.tagInput.css('width', that.textMeasure.width());
    }, 50);
  },
  mayInsertTags: function() {
    var val = this.tagInput.val();
    // We need to split tag text with separators
    // because text pasted from clipboard may contain those.
    _.each(val.split(this.separator), function(word) {
      if (word && !this.collection.where({name: word}, true)) {
        this.collection.push(new Tag({name: word}));
      }
    }, this);
    this.tagInput.val('');
    this.adjustInputWidth('');
  },
  render: function() {
    var $el = this.$el;
    $el.empty();
    $el.append(this.tagMeasure);
    _(this.itemViews).each(function(itemView) {
      $el.append(itemView.render().el);
    });
    $el.append(this.tagInput);
    $el.css('width', this.width);
    this.adjustInputWidth('');
    return this;
  }
});
