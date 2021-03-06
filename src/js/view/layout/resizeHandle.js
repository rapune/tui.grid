/**
 * @fileoverview ResizeHandle for the Header
 * @author NHN Ent. FE Development Team
 */

'use strict';

var $ = require('jquery');
var _ = require('underscore');
var snippet = require('tui-code-snippet');

var View = require('../../base/view');
var constMap = require('../../common/constMap');
var classNameConst = require('../../common/classNameConst');
var DragEventEmitter = require('../../event/dragEventEmitter');
var message = require('../../common/message');
var attrNameConst = constMap.attrName;
var frameConst = constMap.frame;
var CELL_BORDER_WIDTH = constMap.dimension.CELL_BORDER_WIDTH;
var RESIZE_HANDLE_WIDTH = constMap.dimension.RESIZE_HANDLE_WIDTH;

/**
 * Reside Handler class
 * @module view/layout/resizeHandle
 * @extends module:base/view
 * @param {Object} options - Options
 * @ignore
 */
var ResizeHandle = View.extend(/** @lends module:view/layout/resizeHandle.prototype */ {
    initialize: function(options) {
        _.assign(this, {
            columnModel: options.columnModel,
            coordColumnModel: options.coordColumnModel,
            domEventBus: options.domEventBus,
            headerHeight: options.headerHeight,
            handleHeights: options.handleHeights,
            whichSide: options.whichSide || frameConst.R
        });

        this.dragEmitter = new DragEventEmitter({
            type: 'resizeColumn',
            cursor: 'col-resize',
            domEventBus: this.domEventBus,
            onDragMove: _.bind(this._onDragMove, this)
        });

        this.listenTo(this.coordColumnModel, 'columnWidthChanged', this._refreshHandlerPosition);
    },

    className: classNameConst.COLUMN_RESIZE_CONTAINER,

    events: function() {
        var eventHash = {};

        eventHash['mousedown .' + classNameConst.COLUMN_RESIZE_HANDLE] = '_onMouseDown';
        eventHash['dblclick .' + classNameConst.COLUMN_RESIZE_HANDLE] = '_onDblClick';

        return eventHash;
    },

    template: _.template(
        '<div ' +
        attrNameConst.COLUMN_INDEX + '="<%=columnIndex%>" ' +
        attrNameConst.COLUMN_NAME + '="<%=columnName%>" ' +
        'class="' + classNameConst.COLUMN_RESIZE_HANDLE + ' <%=lastClass%>" ' +
        'title="<%=title%>"' +
        'style="height:<%=height%>;display:<%=displayType%>">' +
        '</div>'
    ),

    /**
     * Return an object that contains an array of column width and an array of column model.
     * @returns {{widths: (Array|*), columns: (Array|*)}} Column Data
     * @private
     */
    _getColumnData: function() {
        var columnWidths = this.coordColumnModel.getWidths(this.whichSide);
        var columns = this.columnModel.getVisibleColumns(this.whichSide, true);

        return {
            widths: columnWidths,
            columns: columns
        };
    },

    /**
     * Returns the HTML string of all handler.
     * @returns {String}
     * @private
     */
    _getResizeHandlerMarkup: function() {
        var columnData = this._getColumnData();
        var columns = columnData.columns;
        var length = columns.length;
        var resizeHandleMarkupList = _.map(columns, function(columnModel, index) {
            return this.template({
                lastClass: (index + 1 === length) ? classNameConst.COLUMN_RESIZE_HANDLE_LAST : '',
                columnIndex: index,
                columnName: columnModel.name,
                height: this.handleHeights[index] + 'px',
                title: message.get('resizeHandleGuide'),
                displayType: (columnModel.resizable === false) ? 'none' : 'block'
            });
        }, this);

        return resizeHandleMarkupList.join('');
    },

    /**
     * Render
     * @returns {module:view/layout/resizeHandle} This object
     */
    render: function() {
        var headerHeight = this.headerHeight;
        var htmlStr = this._getResizeHandlerMarkup();

        this.$el.empty().html(htmlStr).css({
            marginTop: -headerHeight,
            height: headerHeight,
            display: 'block'
        });
        this._refreshHandlerPosition();

        return this;
    },

    /**
     * Refresh the position of every handler.
     * @private
     */
    _refreshHandlerPosition: function() {
        var columnData = this._getColumnData();
        var columnWidths = columnData.widths;
        var $resizeHandleList = this.$el.find('.' + classNameConst.COLUMN_RESIZE_HANDLE);
        var handlerWidthHalf = Math.floor(RESIZE_HANDLE_WIDTH / 2);
        var curPos = 0;

        snippet.forEachArray($resizeHandleList, function(item, index) {
            var $handler = $resizeHandleList.eq(index);
            curPos += columnWidths[index] + CELL_BORDER_WIDTH;
            $handler.css('left', curPos - handlerWidthHalf);
        }, this);
    },

    /**
     * Event handler for the 'mousedown' event
     * @param {MouseEvent} ev - mouse event
     * @private
     */
    _onMouseDown: function(ev) {
        var $target = $(ev.target);
        var columnWidths = this.coordColumnModel.getWidths(this.whichSide);
        var columnIndex = parseInt($target.attr(attrNameConst.COLUMN_INDEX), 10);

        this.dragEmitter.start(ev, {
            width: columnWidths[columnIndex],
            columnIndex: this._getHandlerColumnIndex(columnIndex),
            pageX: ev.pageX
        });
    },

    /**
     * Event handler for dragmove event
     * @param {module:event/gridEvent} ev - GridEvent
     * @private
     */
    _onDragMove: function(ev) {
        var startData = ev.startData;
        var diff = ev.pageX - startData.pageX;

        ev.setData({
            columnIndex: startData.columnIndex,
            width: startData.width + diff
        });
    },

    /**
     * Event handler for the 'dblclick' event
     * @param {MouseEvent} mouseEvent - mouse event
     * @private
     */
    _onDblClick: function(mouseEvent) {
        var $target = $(mouseEvent.target);
        var columnIndex = parseInt($target.attr(attrNameConst.COLUMN_INDEX), 10);

        this.domEventBus.trigger('dblclick:resizeColumn', {
            columnIndex: this._getHandlerColumnIndex(columnIndex)
        });
    },

    /**
     * Find the real index (based on visibility) of the column using index value of the handler and returns it.
     * @param {number} index - index value of the handler
     * @returns {number}
     * @private
     */
    _getHandlerColumnIndex: function(index) {
        return (this.whichSide === frameConst.R) ? (index + this.columnModel.getVisibleFrozenCount(true)) : index;
    }
});

module.exports = ResizeHandle;
