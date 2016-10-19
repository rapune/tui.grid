'use strict';

var ModelManager = require('model/manager');
var DomState = require('domState');
var ViewFactory = require('view/factory');

function create(whichSide, options) {
    var modelManager = new ModelManager(options, new DomState($('<div>')));
    var viewFactory = new ViewFactory({
        modelManager: modelManager
    });

    return viewFactory.createFooter(whichSide);
}

describe('Footer', function() {
    describe('render()', function() {
        var footer;

        beforeEach(function() {
            footer = create('R', {
                columnModelList: [
                    {columnName: 'c1', width: 50},
                    {columnName: 'c2', width: 60}
                ]
            });
            footer.dimensionModel.set('footerHeight', 30);
        });

        it('render nothing if dimension.footerHeight is 0', function() {
            footer.dimensionModel.set('footerHeight', 0);
            footer.render();

            expect(footer.$el).toBeEmpty();
        });

        it('height of table should be same as dimension.footerHeight', function() {
            footer.render();

            expect(footer.$el.find('table').height()).toBe(30);
        });

        it('width of each column should be the same as the result of dimension.getColumnWidthList()', function() {
            var widthList, $ths;

            footer.render();

            widthList = footer.dimensionModel.getColumnWidthList('R');
            $ths = footer.$el.find('th');
            expect($ths.eq(0).width()).toBe(widthList[0]);
            expect($ths.eq(1).width()).toBe(widthList[1]);
        });

        it('If the summaryModel does not exist, values should be empty', function() {
            var $ths;

            footer.render();

            $ths = footer.$el.find('th');
            expect($ths.eq(0).html()).toBe('');
            expect($ths.eq(1).html()).toBe('');
        });

        it('If the summaryModel exists, use summary values for HTML of <th>', function() {
            var summaryMap = {
                c1: {
                    sum: 10,
                    avg: 0.4
                },
                c2: {
                    max: 10
                }
            };
            var $ths;

            footer.summaryModel = {
                getValue: function(columnName) {
                    return summaryMap[columnName];
                }
            };
            footer.render();

            $ths = footer.$el.find('th');
            expect($ths.eq(0).html('10, 0.4'));
            expect($ths.eq(1).html('10'));
        });

        it('If a formatter function exists, use it for generating HTML of <th>', function() {
            var $ths;

            function fmt1() {
                return 'formatted1';
            }
            function fmt2() {
                return 'formatted2';
            }

            footer.formatters = {
                c1: fmt1,
                c2: fmt2
            };
            footer.render();
            $ths = footer.$el.find('th');

            expect($ths.eq(0).html()).toBe(fmt1());
            expect($ths.eq(1).html()).toBe(fmt2());
        });

        it('Formatter should take a value from the summaryModel as a paramater', function() {
            var fmt1 = jasmine.createSpy();
            var fmt2 = jasmine.createSpy();
            var summaryMap = {
                c1: {sum: 10},
                c2: {max: 5}
            };

            footer.summaryModel = {
                getValue: function(columnName) {
                    return summaryMap[columnName];
                }
            };
            footer.formatters = {
                c1: fmt1,
                c2: fmt2
            };

            footer.render();

            expect(fmt1).toHaveBeenCalledWith(summaryMap.c1);
            expect(fmt2).toHaveBeenCalledWith(summaryMap.c2);
        });
    });

    it('Refresh <th> whenever change event occurs on the summaryModel', function() {
        var $ths;
        var footer = create('R', {
            columnModelList: [
                {columnName: 'c1', width: 50},
                {columnName: 'c2', width: 60}
            ],
            footer: {
                height: 30,
                columnSummary: {}
            }
        });

        footer.render();
        $ths = footer.$el.find('th');

        footer.summaryModel.trigger('change', 'c1', {
            sum: 10,
            evg: 5
        });

        expect($ths.eq(0).html()).toBe('10, 5');
    });
});
