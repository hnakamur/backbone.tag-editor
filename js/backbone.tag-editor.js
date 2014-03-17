var Tag = Backbone.Model.extend();

var TagItemView = Backbone.View.extend({
  className: "tag-editor-tag",
  template: _.template('<div class="tag-editor-text"><%= name %></div>' + 
      '<a class="tag-editor-delete">x</a>'),
  render: function() {
    var html = this.template(this.model.toJSON());
    this.$el.html(html);
    return this;
  }
});

var Tags = Backbone.Collection.extend({
  model: Tag
});

var TagEditorView = Backbone.View.extend({
  tagRegex: /^(.*)[, ]+$/,
  sepRegex: /[, ]+/m,
  initialize: function(options) {
    this.width = options.width;
    this.itemViews = _.map(this.collection.models, function(model) {
      return new TagItemView({model: model});
    });
    this.tagInput = Backbone.$('<input class="tag-editor-input">').css('width', 0);
    this.tagMeasure = (new TagItemView({model: new Tag({name: ""})})).render().$el;
    this.tagMeasure.css({position: 'absolute', left: "-999px"});
    this.textMeasure = this.tagMeasure.find('.tag-editor-text');
  },
  className: 'tag-editor-field',
  events: {
    click: 'onClick',
    'click .tag-editor-delete': 'onDeleteClick',
    'focus .tag-editor-input': 'onInputFocus',
    'blur .tag-editor-input': 'onInputBlur',
    'keydown .tag-editor-input': 'onInputKeydown',
    'keyup .tag-editor-input': 'onInputKeyup'
  },
  onClick: function() {
    this.tagInput.focus();
  },
  _indexOfTag: function(tag) {
    var i, models = this.collection.models, l = models.length, model;
    for (i = 0; i < l; i++) {
      model = models[i];
      if (model.get('name') === tag) {
        return i;
      }
    }
    return -1;
  },
  onDeleteClick: function(e) {
    var $textElem = Backbone.$(e.target).prev(),
      tag = $textElem.text(),
      $tagEditorField = $textElem.parent().parent(),
      view = $tagEditorField.data('view'),
      i = view._indexOfTag(tag);
    if (i !== -1) {
      view.collection.models.splice(i, 1);
      view.itemViews.splice(i, 1);
      $textElem.parent().remove();
    }
    return false;
  },
  onInputFocus: function() {
    this.tagInput.css('font', this.textMeasure.css('font'));
  },
  onInputBlur: function() {
    var val = this.tagInput.val();
    this._insertTag(val.replace(this.sepRegex, ''));
  },
  onInputKeydown: function(e) {
    var val = this.tagInput.val(), tags = this.collection;
    if (!val && e.which == 8 /* Backspace */ && tags.length) {
      tags.pop();
      this.itemViews.pop();
      this.tagInput.prev().remove();
    }
  },
  onInputKeyup: function() {
    var val = this.tagInput.val(), matches, that;
    if (val) {
      matches = this.tagRegex.exec(val);
      if (matches) {
        // We need to split tag text with separators
        // because text pasted from clipboard may contain those.
        that = this;
        _.each(matches[1].split(this.sepRegex), function(tag) {
          that._insertTag(tag);
        });
      } else {
        this._adjustInputWidth(val);
      }
    }
  },
  _adjustInputWidth: function(val) {
    var that = this;
    // To avoid juggling of input widths, we measure text width
    // with two more characters.  We use 'W' here because it is
    // a wide character.
    this.textMeasure.text(val + 'WW');
    setTimeout(function() {
      that.tagInput.css('width', that.textMeasure.width());
    }, 50);
  },
  _insertTag: function(tag) {
    var model, itemView;
    if (tag && !this.collection.where({name: tag}, true)) {
      model = new Tag({name: tag});
      this.collection.push(model);
      itemView = new TagItemView({model: model});
      this.itemViews.push(itemView);
      this.tagInput.before(itemView.render().el).val('');
    } else {
      this.tagInput.val('');
    }
    this._adjustInputWidth('');
  },
  render: function() {
    var $el = this.$el;
    $el.append(this.tagMeasure);
    _(this.itemViews).each(function(itemView) {
      $el.append(itemView.render().el);
    });
    $el.append(this.tagInput);
    $el.css('width', this.width);
    $el.data('view', this);
    this._adjustInputWidth('');
    return this;
  }
});
