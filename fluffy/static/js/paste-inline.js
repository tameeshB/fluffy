var whitelistedKeys = [
    // arrow keys
    37, 38, 39, 40,

    // home/end
    35, 36,

    // page up/down
    33, 34,
];

function realSort(array) {
    // wtf javascript
    array.sort(function(a, b) { return a - b; });
}

function selectedLines() {
    /**
     * @return {array} list of currently selected line numbers
    */
    var h = window.location.hash || '#';
    if (h.substring(0, 1) === '#') {
        h = h.substring(1);
    }

    var maybe_selected = h.split(',');
    var selected = [];
    for (var i = 0; i < maybe_selected.length; i++) {
        var el = maybe_selected[i];
        if (el.substring(0, 1) !== 'L') {
            continue;
        }

        var parts = el.substring(1).split('-');
        if (parts.length == 1) {
            parts.push(parts[0]);
        }
        if (parts.length == 2) {
            parts[0] = parseInt(parts[0]);
            parts[1] = parseInt(parts[1]);

            for (var num = parts[0]; num <= parts[1]; num++) {
                if (num >= 1 && selected.indexOf(num) === -1) {
                    selected.push(num);
                }
            }
        }

    }
    realSort(selected);
    return selected;
}

function updateSelectedHash(selected) {
    function rangeFromNumber(num) {
        var range = ('' + num).split('-').map(function(i) {
            return parseInt(i);
        });

        if (range.length == 1) {
            range.push(range[0]);
        }

        return range;
    }

    if (selected.length > 0) {
        realSort(selected);
        for (var i = selected.length - 1; i >= 0; i--) {
            var cur = rangeFromNumber(selected[i]);
            selected[i] = 'L' + selected[i];

            // see if we can combine with the previous one
            if (i > 0) {
                var prev = rangeFromNumber(selected[i - 1]);
                if (prev[1] == cur[0] - 1) {
                    selected[i - 1] = prev[0] + '-' + cur[1];
                    selected.splice(i, 1);
                }
            }
        }
        window.location.hash = '#' + selected.join(',');
    } else {
        // hack (for old browsers that don't support pushState) because
        // removing entirely causes a scroll to the top
        window.location.hash = '_';

        // for new browsers, use pushState to remove the hash entirely
        history.replaceState('', document.title, window.location.pathname);
    }
}

$(document).ready(function() {

    $("#do_word_wrap").click(function () {
        let text_to_wrap = $(".highlight").find('pre');
        if (text_to_wrap.css('white-space')==="pre") {
            text_to_wrap.css('white-space', 'break-spaces');
        } else {
            text_to_wrap.css('white-space', '');
        }
    });

    var numbers = $('.highlight > pre > span');
    numbers.each(function (i) {
        var data = $("<td class='line-data'></td>").text($(this).text());
        var line_num = $("<td class='line-number'></td>").text(i);
        $(this).html("");
        $(this).append(line_num, data);
    });
    var setState = -1;
    $(document).mouseup(function() {
        setState = -1;
    });

    function updateLineClasses(num, isSelected) {
        /**
         * Add or remove "selected" classes from the line number and its line.
         */
        var els = $('#LL' + num + ',#line-' + num);
        if (isSelected) {
            els.addClass('selected');
        } else {
            els.removeClass('selected');
        }
    }

    function maybeChangeState(el) {
        /**
         * Possibly change the state of a line number.
         *
         * Depending on the current mode of the drag (either highlight
         * or un-highlight), we update this row to match.
         */
        if (setState === -1) {
            return;
        }

        var selected = selectedLines();
        var line = parseInt(el.get(0).id.replace("line-", ""));
        var idx = selected.indexOf(line);

        if (idx === -1 && setState === 1) {
            updateLineClasses(line, true);
            selected.push(line);
            console.log("##"+ selected);
            updateSelectedHash(selected);
        } else if (idx !== -1 && setState === 0) {
            selected.splice(idx, 1);
            updateLineClasses(line, false);
            updateSelectedHash(selected);
        }
        return false;
    }

    numbers.on('mousedown', function(e) {
        var selected = selectedLines();
        var line = parseInt(this.id.replace("line-", ""));
        setState = selected.indexOf(line) === -1 ? 1 : 0;
        return maybeChangeState($(this));
    });
    numbers.on('click', function() { return false; });
    numbers.on('mouseenter', function(e) { return maybeChangeState($(this)); });
    numbers.on('dragstart', function(e) {
        return false;
    });

    $('#paste').on('keydown', function(e) {
        if (e.ctrlKey || e.metaKey) {
            if (e.which == 46 || e.which == 8) {  // backspace and delete
                return false;
            }
            return true;
        }
        if ($.inArray(e.which, whitelistedKeys) !== -1) {
            return true;
        }
        return false;
    }).on('cut paste', function(e) {
        return false;
    }).bind('dragover drop', function(e) {
        return false;
    });


    // highlight existing lines
    var selected = selectedLines();
    var hasMovedDown = false;
    for (var i = 0; i < selected.length; i++) {
        var line = selected[i];
        updateLineClasses(line, true);

        if (!hasMovedDown) {
            var e = $('#LL' + line);
            hasMovedDown = true;
            if ($('body').scrollTop() == 0) {
                // Chrome needs body, Firefox needs html :\
                $('html, body').scrollTop(e.offset().top - 50);
            }
        }
    }

    $('#style').change(function() {
        changeStyleTo($(this).val());
    });
});
