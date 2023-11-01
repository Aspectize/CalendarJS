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

            headerToolbar: htb,

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

            locale: Aspectize.UiExtensions.GetProperty(elem, 'Locale'),
            nowIndicator: true,
            height: '100%',

            eventOrder: eventSort,
            eventOrderStrict: true,

            eventContent: function (arg) {

                return { html: arg.event.title };
            }
        };
        //#endregion

        //#region OnNewEvent
        function fSelect(arg) {

            var eventData = {
                start: arg.start,
                end: arg.end
            };

            Aspectize.UiExtensions.Notify(elem, 'OnNewEvent', eventData);
        }
        if (fcOptions.selectable) fcOptions.select = fSelect;
        //#endregion

        //#region OnNeedEvents
        function needEvents(fetchInfo, successCallback, failureCallback) {

            var eventData = {
                start: fetchInfo.start,
                end: fetchInfo.end
            };

            Aspectize.UiExtensions.Notify(elem, 'OnNeedEvents', eventData);

            if (successCallback) {
                var events = fcObj ? fcObj.getEvents() : [];
                successCallback(events);
            }
        }
        fcOptions.events = needEvents;
        //#endregion

        //#region EventColumn events 
        //#region OnEventChanged
        var fEventResize = function (arg) {

            var evt = arg.event;
            var eventCell = elem.aasEventCells[evt.id];

            Aspectize.UiExtensions.Notify(eventCell, 'OnEventChanged', { Event: evt, DomEvent: arg.jsEvent, Start: evt.start, End: evt.end, CancelChange: null });

        };
        fcOptions.eventResize = fEventResize
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

    Properties: { Text: '', Start: null, End: null, AllDay: false, Order: 0, EditMode: false, CssClass: '', DisplayStartTime: true, DisplayEndTime: true },
    Events: ['OnPropertyChanged', 'OnEventChanged', 'OnEventClick'],

    Map: {
        Text: 'title', Start: 'start', End: 'end', AllDay: 'allDay',
        EditMode: ['editable', 'startEditable', 'durationEditable'],
        DisplayStartTime: 'displayEventTime', DisplayEndTime: 'displayEventEnd',
        CssClass: 'classNames', Order: 'order'
        //TimeFormat: 'timeFormat'
    },

    Init: function (elem, controlInfo) {

        var map = this.Map;
        var eventId = elem.aasCell.RowId;
        var fcObj = elem.aasCell.ParentControl.aasFcObj;

        Aspectize.UiExtensions.AddMergedPropertyChangeObserver(elem, function (sender, arg) {

            var evt = fcObj.getEventById(eventId);

            if (evt) {

                for (var p in arg) {

                    var v = arg[p];
                    var f = map[p];

                    var set = (p !== 'Order') ? 'setProp' : 'setExtendedProp';

                    if (f) {

                        if (f.constructor === Array) {

                            for (var n = 0; n < f.length; n++) {

                                var af = f[n];

                                if (af in evt) {

                                    evt[set](af, v);
                                }
                            }

                        } else if (f in evt) {

                            evt[set](f, v);
                            //if (v.constructor === Date) {

                            //    evt.setProp(f, v);
                            //} else {

                            //    if ((evt[f].constructor === Array) && evt[f].length) {

                            //        evt[f][0] = v;

                            //    } else evt[f] = v;
                            //}
                        }
                    }
                }
            }
        });
    }
});

