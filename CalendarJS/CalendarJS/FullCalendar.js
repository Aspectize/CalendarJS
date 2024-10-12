/// <reference path="S:\Delivery\Aspectize.core\AspectizeIntellisense.js" />
/// <reference path="S:\Delivery\Aspectize.core\AspectizeIntellisenseLibrary.js" />

/* Aspectize FullCalendar extension */

Aspectize.Extend("FullCalendar", {

    Binding: 'GridBinding',

    Properties: { InitialDate: new Date(), EventSortExpression: 'start,-duration,order', EventOverlap: true, EditMode: false, Locale: 'en', View: 'dayGridMonth', LeftButtons: 'prevYear,prev,next,nextYear today', CenterButtons: 'title', RightButtons: 'dayGridMonth,dayGridWeek,dayGridDay listDay timeGridWeek', WeekEnds: true, WeekNumbers: false, BusinessHours: '08:30-18:30', MinTime: '00:00:00', MaxTime: '24:00:00', UseButtonIcons: true, EventDisplayTime:true },
    Events: ['OnPropertyChanged', 'OnNeedEvents', 'OnNewEvent', 'OnAllowSelect'],

    Init: function (elem, controlInfo) {

        function getEvtHtml(title, timeText, bgColor, txtColor) {

            var styleList = [];
            if(bgColor) styleList.push('background-color:' + bgColor + ';');
            if (txtColor) styleList.push('color:' + txtColor + ';');
            var styles = styleList.join('');

            var timePart = '<div class="fc-event-time">' + timeText + '</div>';
            var titlePart = '<div class="fc-event-title-container"><div class="fc-event-title fc-sticky">'+ title + '</div></div>';
            var htmlEvt = '<div class="fc-event-main-frame" style="' + styles + '">' + timePart + titlePart + '</div>';

            return htmlEvt;
        }

        elem.aasEventCells = {};

        var editMode = Aspectize.UiExtensions.GetProperty(elem, 'EditMode');
        var viewMode = Aspectize.UiExtensions.GetProperty(elem, 'View');
        var initDate = Aspectize.UiExtensions.GetProperty(elem, 'InitialDate');
        var eventSort = Aspectize.UiExtensions.GetProperty(elem, 'EventSortExpression');
        var eventOverlap = Aspectize.UiExtensions.GetProperty(elem, 'EventOverlap');
        
        var locale = Aspectize.UiExtensions.GetProperty(elem, 'Locale');
        var useIcons = Aspectize.UiExtensions.GetProperty(elem, 'UseButtonIcons');

        function removeToolTips(element) {

            var buttons = element.querySelectorAll('.fc-header-toolbar button[title]');

            for (var n = 0; n < buttons.length; n++) buttons[n].title = '';
        }

        function getTexts(locale) {

            var isFrench = locale === 'fr';

            var button = {
                today: isFrench ? 'aujourd\'hui' : 'today',
                month: isFrench ? 'mois' : 'month',
                week: isFrench ? 'semaine' : 'week',
                day: isFrench ? 'jour' : 'day',
                list: isFrench ? 'liste' : 'list',

                prev: (isFrench ? 'Précédent' : 'Previous'),
                next: (isFrench ? 'Suivant' : 'Next'),

                prevYear: (isFrench ? 'Année précédente' : 'Previous year'),
                nextYear: (isFrench ? 'Année suivante' : 'Next year')
            };
            var allDay = isFrench ? 'journée' : 'all-day';

            return { button: button, allDay: allDay };
        }

        //#region businessHours
        var weekEnds = Aspectize.UiExtensions.GetProperty(elem, 'WeekEnds');
        var businessHours = Aspectize.UiExtensions.GetProperty(elem, 'BusinessHours');
        var bh = false;
        var rxBH = /(\d{2}:\d{2})-(\d{2}:\d{2})/;
        if (rxBH.test(businessHours)) {

            var parts = businessHours.split('-');
            bh = {
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

            selectAllow: function (selectInfo) {

                var now = new Date();
                var eventArg = { start: selectInfo.start, end: selectInfo.end, allDay: selectInfo.allDay, valueOfNow: now.valueOf(), AllowSelect:true };
                Aspectize.UiExtensions.Notify(elem, 'OnAllowSelect', eventArg);

                return eventArg.AllowSelect;
            },
            titleFormat: { year: 'numeric', month: 'long', day: '2-digit' },
            initialView: viewMode,
            themeSystem: 'standard',

            nowIndicator: true,
            height: '100%',

            eventOrder: eventSort,
            eventOrderStrict: true,
            
            eventDidMount :function (arg) {
                if (arg.backgroundColor) arg.el.style.backgroundColor = arg.backgroundColor;
                if (arg.textColor) arg.el.style.color = arg.textColor;
            },
            eventContent: function (arg) {
                var bgColor = arg.backgroundColor;
                var txtColor = arg.textColor;
                

                var eventDisplayTime = Aspectize.UiExtensions.GetProperty(elem, 'EventDisplayTime');

                var timeText = eventDisplayTime ? arg.timeText : '';
                return { html: getEvtHtml(arg.event.title, timeText, bgColor, txtColor) };
            }
        };
        //#endregion

        //#region OnNewEvent
        function fSelect(arg) {

            var eventData = { start: arg.start, end: arg.end };

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

            Aspectize.UiExtensions.Notify(eventCell, 'OnEventChanged', { Id: evt.id, start: start, end: end, Event: evt, DomEvent: arg.jsEvent, CancelChange: null });
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

        var fcObj = null;
        elem.aasFcObj = fcObj;

        if (window.FullCalendar && window.FullCalendar.Calendar) {

            fcObj = new FullCalendar.Calendar(elem, fcOptions);
            fcObj.render();

            //#region if defaut values for Locale, UseButtonIcons, EventOverlap or WeekEnds are changed
            if (locale !== 'en') {

                var texts = getTexts(locale);
                fcObj.setOption('buttonText', texts.button);
                fcObj.setOption('allDayText', texts.allDay);
                fcObj.setOption('locale', locale);
            }

            if (!useIcons) {
                fcObj.setOption('buttonIcons', useIcons);
            }

            if (!weekEnds) {

                fcObj.setOption('weekends', weekEnds);
                var xbh = fcObj.getOption('businessHours');
                xbh.daysOfWeek = weekEnds ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];
                fcObj.setOption('businessHours', xbh);
            }

            if (!eventOverlap) {

                fcObj.setOption('slotEventOverlap', eventOverlap);

            }
            //#endregion

            elem.aasFcObj = fcObj;

            controlInfo.Rerender = function () {

                fcObj.refetchEvents();
                fcObj.render();
                removeToolTips(elem);
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
                removeToolTips(elem);
            };

            removeToolTips(elem);
        }

        Aspectize.UiExtensions.AddMergedPropertyChangeObserver(elem, function (sender, arg) {

            if (!fcObj) return;

            var newOptions = {};

            for (var p in arg) {

                var v = arg[p];

                switch (p) {
                    case 'EventOverlap': fcObj.setOption('slotEventOverlap', v); break;

                    case 'UseButtonIcons':

                        fcObj.setOption('buttonIcons', v);
                        break;

                    case 'Locale': {

                        var texts = getTexts(v);
                        fcObj.setOption('buttonText', texts.button);
                        fcObj.setOption('allDayText', texts.allDay);
                        fcObj.setOption('locale', v);

                    } break;

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

    Properties: { Text: '', Start: null, End: null, AllDay: false, Order: 0, EditMode: false, CssClass: '', BgColor: 'Black', Color: 'White' },
    Events: ['OnPropertyChanged', 'OnStartChanged', 'OnEndChanged', 'OnEventChanged', 'OnEventClick'],

    Map: {
        Text: 'title', Start: 'start', End: 'end', AllDay: 'allDay',
        EditMode: ['startEditable', 'durationEditable'],
        CssClass: 'classNames', BgColor: 'backgroundColor', Color: 'textColor', Order: 'order'
    },

    Init: function (elem, controlInfo) {

        var map = this.Map;
        var eventId = elem.aasCell.RowId;
        var fcObj = elem.aasCell.ParentControl.aasFcObj;
        if (!fcObj) return;

        var pBag = controlInfo.PropertyBag;

        Aspectize.UiExtensions.AddMergedPropertyChangeObserver(elem, function (sender, arg) {

            if (!fcObj) return;

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

                        fcObj.refetchEvents();
                    }
                }
            }
        });
    }
});

