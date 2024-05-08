/// <reference path="S:\Delivery\Aspectize.core\AspectizeIntellisense.js" />
/// <reference path="S:\Delivery\Aspectize.core\AspectizeIntellisenseLibrary.js" />

/* Aspectize FullCalendar extension */

Aspectize.Extend("FullCalendar", {

    Binding: 'GridBinding',

    Properties: { InitialDate: new Date(), EventSortExpression: 'start,-duration,order', EditMode: false, Locale: 'fr', View: 'dayGridMonth', LeftButtons: 'prevYear,prev,next,nextYear today', CenterButtons: 'title', RightButtons: 'dayGridMonth,dayGridWeek,dayGridDay listDay timeGridWeek', WeekEnds: true, WeekNumbers: false, BusinessHours: '08:30-18:30', MinTime: '00:00:00', MaxTime: '24:00:00' },
    Events: ['OnPropertyChanged', 'OnNeedEvents', 'OnNewEvent'],

    Init: function (elem, controlInfo) {

        elem.aasEventCells = {};

        var editMode = Aspectize.UiExtensions.GetProperty(elem, 'EditMode');
        var viewMode = Aspectize.UiExtensions.GetProperty(elem, 'View');
        var initDate = Aspectize.UiExtensions.GetProperty(elem, 'InitialDate');
        var eventSort = Aspectize.UiExtensions.GetProperty(elem, 'EventSortExpression');
        var locale = Aspectize.UiExtensions.GetProperty(elem, 'Locale');
        var isFrench = locale === 'fr';

        var buttonTexts = {
            today: isFrench ? 'aujourd\'hui' : 'today',
            month: isFrench ? 'mois' : 'month',
            week: isFrench ? 'semaine' : 'week',
            day: isFrench ? 'jour' : 'day',
            list: isFrench ? 'liste' : 'list',

            prev: isFrench ? 'Précédent' : 'Previous',
            next: isFrench ? 'Suivant' : 'Next'
        };

        //#region businessHours
        var weekEnds = Aspectize.UiExtensions.GetProperty(elem, 'WeekEnds');
        var businessHours = Aspectize.UiExtensions.GetProperty(elem, 'BusinessHours');
        var bh = false;
        var rxBH = /(\d{2}:\d{2})-(\d{2}:\d{2})/;
        if (rxBH.test(businessHours)) {

            var parts = businessHours.split('-');
            bh = {
                // days of week. an array of zero-based day of week integers (0=Sunday)
                daysOfWeek: weekEnds ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5],
                startTime: parts[0],
                endTime: parts[1]
            };
        }
        //#endregion

        //#region headerToolbar
        var htb = {
            left: Aspectize.UiExtensions.GetProperty(elem, 'LeftButtons'),
            center: Aspectize.UiExtensions.GetProperty(elem, 'CenterButtons'),
            right: Aspectize.UiExtensions.GetProperty(elem, 'RightButtons')
        };
        //#endregion

        //#region all options
        var fcOptions = {

            buttonText: buttonTexts,

            headerToolbar: htb,

            allDayText: isFrench ? 'journée' : 'all-day',

            businessHours: bh,
            slotMinTime: Aspectize.UiExtensions.GetProperty(elem, 'MinTime'),
            slotMaxTime: Aspectize.UiExtensions.GetProperty(elem, 'MaxTime'),
            weekNumbers: Aspectize.UiExtensions.GetProperty(elem, 'WeekNumbers'),
            weekNumberCalculation: 'ISO',

            initialDate: initDate,

            selectable: editMode,   //Allows a user to highlight multiple days or timeslots by clicking and dragging
            selectMirror: true,
            editable: editMode,     //Determines whether the events on the calendar can be modified.
            eventResizableFromStart: editMode,

            titleFormat: { year: 'numeric', month: 'long', day: '2-digit' },
            initialView: viewMode,
            themeSystem: 'standard',

            locale: locale,
            nowIndicator: true,
            height: '100%',

            eventOrder: eventSort,
            eventOrderStrict: true,

            eventContent: function (arg) {

                return { html: arg.event.title };
            },

            buttonIcons: {
                prev: 'chevron-left',
                next: 'chevron-right',
                prevYear: 'chevrons-left',
                nextYear: 'chevrons-right'
            }


        };
        //#endregion

        //#region OnNewEvent
        function fSelect(arg) {

            var eventData = { Start: arg.start, End: arg.end };

            Aspectize.UiExtensions.Notify(elem, 'OnNewEvent', eventData);
        }
        if (fcOptions.selectable) fcOptions.select = fSelect;
        //#endregion

        //#region OnNeedEvents
        function needEvents(fetchInfo, successCallback, failureCallback) {


            var xEvents = fcObj ? fcObj.getEvents() : [];
            var xEventsObj = {};
            for (var n = 0; n < xEvents.length; n++) {
                var e = xEvents[n];
                xEventsObj[e.id] = e;
            }

            var eventArg = { start: fetchInfo.start, end: fetchInfo.end };
            Aspectize.UiExtensions.Notify(elem, 'OnNeedEvents', eventArg);

            if (successCallback) {
                var currentvents = fcObj ? fcObj.getEvents() : [];
                var newEvents = currentvents.filter(function (x) { return !(x.id in xEventsObj) });

                successCallback(newEvents);
            }
        }
        fcOptions.events = needEvents;
        //#endregion

        //#region EventColumn events 
        //#region OnEventChanged
        var fEventResize = function (arg) {

            var evt = arg.event;
            var eventCell = elem.aasEventCells[evt.id];

            var start = evt.start;
            var end = evt.end;

            var oldStart = eventCell.aasGetProperty('Start');
            if (oldStart.valueOf() !== start.valueOf()) eventCell.aasSetProperty('Start', start);

            var oldEnd = eventCell.aasGetProperty('End');
            if (oldEnd.valueOf() !== end.valueOf()) eventCell.aasSetProperty('End', end);

            Aspectize.UiExtensions.Notify(eventCell, 'OnEventChanged', { Id: evt.id, Start: start, End: end, Event: evt, DomEvent: arg.jsEvent, CancelChange: null });
        };
        fcOptions.eventResize = fEventResize;
        fcOptions.eventDrop = fEventResize;
        //#endregion

        //#region OnEventClick
        fcOptions.eventClick = function (arg) {
            var evt = arg.event;
            var eventCell = elem.aasEventCells[evt.id];

            Aspectize.UiExtensions.SetCurrent(elem, evt.id);
            Aspectize.UiExtensions.Notify(eventCell, 'OnEventClick', { Id: evt.id, Event: evt, DomEvent: arg.jsEvent });
        };
        //#endregion
        //#endregion

        var fcObj = new FullCalendar.Calendar(elem, fcOptions);
        fcObj.render();

        elem.aasFcObj = fcObj;

        controlInfo.Rerender = function () {

            fcObj.render();
        },

        controlInfo.StartRender = function (control, rowCount) {

        };

        controlInfo.RowRender = function (control, cellControls) {

        };

        controlInfo.EndRender = function (control, rowControls) {

            var oldCells = elem.aasEventCells;
            elem.aasEventCells = {};

            var count = rowControls.length;
            for (var n = 0; n < count; n++) {

                var c = rowControls[n].CellControls[0]; // The cell corresponding to the CalendarEvent ColumnBinding
                var cellInfo = c.aasCell;

                elem.aasEventCells[cellInfo.RowId] = c;
                oldCells[cellInfo.RowId] = null;
                delete oldCells[cellInfo.RowId];

                if (cellInfo.IsNew) {

                    var start = Aspectize.UiExtensions.GetProperty(c, 'Start');
                    var end = Aspectize.UiExtensions.GetProperty(c, 'End');

                    var editable = Aspectize.UiExtensions.GetProperty(c, 'EditMode');

                    var evt = {

                        id: cellInfo.RowId,
                        title: Aspectize.UiExtensions.GetProperty(c, 'Text'),
                        start: start,
                        end: end,
                        allDay: Aspectize.UiExtensions.GetProperty(c, 'AllDay'),

                        editable: editable,
                        startEditable: editable,
                        durationEditable: editable,

                        displayEventTime: Aspectize.UiExtensions.GetProperty(c, 'DisplayStartTime'),
                        displayEventEnd: Aspectize.UiExtensions.GetProperty(c, 'DisplayEndTime'),

                        classNames: Aspectize.UiExtensions.GetProperty(c, 'CssClass')
                    };

                    fcObj.addEvent(evt);
                }
            }

            for (var oldId in oldCells) {
                var evt = fcObj.getEventById(oldId);
                evt.remove();
            }

            fcObj.render();
        };

        Aspectize.UiExtensions.AddMergedPropertyChangeObserver(elem, function (sender, arg) {

            var newOptions = {};

            for (var p in arg) {

                var v = arg[p];

                switch (p) {

                    case 'Locale': fcObj.setOption('locale', v); break;
                    case 'View': fcObj.changeView(v); break;
                    case 'InitialDate': fcObj.gotoDate(v); break;

                    case 'EventSortExpression': fcObj.setOption('eventOrder', v); break;

                    case 'EditMode': {

                        fcObj.setOption('selectable', v);
                        fcObj.setOption('editable', v);
                        fcObj.setOption('startEditable', v);
                        fcObj.setOption('durationEditable', v);
                        fcObj.setOption('select', v ? fSelect : null);
                        fcObj.setOption('eventResize', v ? fEventResize : function (info) { info.revert(); });
                        //newOptions.eventDrop = v ? fEventDrop : null;
                    } break;

                    case 'LeftButtons': {
                        var xtb = fcObj.getOption('headerToolbar');
                        xtb.left = v;
                        fcObj.setOption('headerToolbar', xtb);
                    } break;
                    case 'CenterButtons': {
                        var xtb = fcObj.getOption('headerToolbar');
                        xtb.center = v;
                        fcObj.setOption('headerToolbar', xtb);
                    } break;
                    case 'RightButtons': {
                        var xtb = fcObj.getOption('headerToolbar');
                        xtb.right = v;
                        fcObj.setOption('headerToolbar', xtb);
                    } break;

                    case 'WeekNumbers': fcObj.setOption('weekNumbers', v); break;

                    case 'WeekEnds':
                        fcObj.setOption('weekends', v);
                        var xbh = fcObj.getOption('businessHours');
                        xbh.daysOfWeek = v ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];
                        fcObj.setOption('businessHours', xbh);
                        break;

                    case 'BusinessHours': {

                        if (rxBH.test(v)) {

                            var weekEnds = fcObj.getOption('weekends');
                            var parts = v.split('-');
                            var nbh = {
                                // days of week. an array of zero-based day of week integers (0=Sunday)
                                daysOfWeek: weekEnds ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5],
                                startTime: parts[0],
                                endTime: parts[1]
                            };
                            fcObj.setOption('businessHours', nbh);
                        }

                    } break;

                    case 'MinTime': fcObj.setOption('minTime', v); break;
                    case 'MaxTime': fcObj.setOption('maxTime', v); break;
                }
            }

        });
    }
});

Aspectize.Extend("CalendarEvent", {

    Binding: 'ColumnBinding',

    Properties: { Text: '', Start: null, End: null, AllDay: false, Order: 0, EditMode: false, CssClass: '', DisplayStartTime: true, DisplayEndTime: true, BgColor: 'Black', Color: 'White' },
    Events: ['OnPropertyChanged', 'OnStartChanged', 'OnEndChanged', 'OnEventChanged', 'OnEventClick'],

    Map: {
        Text: 'title', Start: 'start', End: 'end', AllDay: 'allDay',
        EditMode: ['startEditable', 'durationEditable'],
        DisplayStartTime: 'displayEventTime', DisplayEndTime: 'displayEventEnd',
        CssClass: 'classNames', BgColor: 'backgroundColor', Color: 'textColor', Order: 'order'
    },

    Init: function (elem, controlInfo) {

        var map = this.Map;
        var eventId = elem.aasCell.RowId;
        var fcObj = elem.aasCell.ParentControl.aasFcObj;
        var pBag = controlInfo.PropertyBag;

        Aspectize.UiExtensions.AddMergedPropertyChangeObserver(elem, function (sender, arg) {

            var evt = fcObj.getEventById(eventId);

            if (evt) {

                for (var p in arg) {

                    var v = arg[p];
                    var f = map[p];

                    var specificSet = false;
                    var set = 'setProp';
                    switch (p) {
                        case 'Order':
                            set = 'setExtendedProp';
                            break;

                        default:
                            switch (p) {
                                case 'Start':
                                case 'End':
                                case 'AllDay':
                                    set = 'set' + p; specificSet = true;
                                    break;
                            }
                    }

                    if (f) {

                        if (f.constructor === Array) {

                            for (var n = 0; n < f.length; n++) {

                                var af = f[n];

                                evt[set](af, v);
                            }

                        } else {

                            if (specificSet) {

                                var editable = pBag.EditMode;
                                if (!editable) {
                                    evt.setProp('startEditable', true);
                                    evt.setProp('durationEditable', true);
                                }

                                evt[set](v);

                                if (!editable) {
                                    evt.setProp('startEditable', false);
                                    evt.setProp('durationEditable', false);
                                }

                                if (set === 'setAllDay') {

                                    if (!v) {
                                        evt.setStart(pBag.Start);
                                        evt.setEnd(pBag.End);
                                    }
                                }

                            } else evt[set](f, v);
                        }
                    }
                }
            }
        });
    }
});

