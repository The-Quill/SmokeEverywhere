// ==UserScript==
// @name         Unstar/unpin/delete for room owners
// @namespace    http://stackoverflow.com/users/578411/rene
// @version      0.3
// @description  RO Transcript
// @author       rene
// @match        *://chat.stackoverflow.com/transcript/*
// @match        *://chat.stackexchange.com/transcript/*
// @match        *://chat.meta.stackexchange.com/transcript/*
// @grant        none
// ==/UserScript==

/*global $:false, alert:false, MutationObserver:false, input:false */

(function () {
    'use strict';

    // http://meta.stackexchange.com/a/262239/158100
    function unstar(node) {
        var fkey = document.getElementById('fkey').value,
            id = node.parentElement.id.split('-')[1];
        $.post('/messages/' + id + '/unstar', {fkey: fkey}, function (data, status) {
            if (status !== 'success' || data !== 'ok') {
                alert('Not OK? ' + status + ' | ' + data);
            } else {
                node.remove();
            }
        });
    }

    function moveto(node, target) {
        var fkey = document.getElementById('fkey').value,
            id = node.parentElement.id.split('-')[1],
            href = $(node.parentElement).find('a'),
            re = /(?:\w|[.\/:])*\/transcript\/(\d+)/,
            matches;
        if (target === undefined) {
            target = input('move to room id');
        }
        if (href.length > 0) {
            matches = re.exec($(href[0]).prop('href'));
            if (matches !== null && matches.length > 1) {
                $.ajax({
                    type: 'POST',
                    data: 'ids=' + id + '&to=' + target + '&fkey=' + fkey,
                    url: '/admin/movePosts/' + matches[1],
                    success: function () { $(node.parentElement).fadeOut(2000);  },
                    error: function () { $(node.parentElement).css('background-color', 'yellow'); }
                });
            }
        }
    }

    function movetotrash(node) {
        moveto(node, 48058);
    }

    function movetoGraveYard(node) {
        moveto(node, 90230);
    }

    function menuBuilder(node, labelText, spriteClass, callback) {
        var outer = document.createElement('span'),
            sprite = document.createElement('span'),
            text = document.createTextNode(labelText);

        sprite.className = "sprite " + spriteClass;
        outer.className = "star";
        outer.style.display = "block";
        outer.appendChild(sprite);
        outer.appendChild(text);

        outer.addEventListener(
            "click",
            function () {
                callback(node);
            },
            false
        );
        return outer;
    }

    function unpinBuilder(node) {
        return menuBuilder(
            node,
            "unpin/cancel stars (RO only)",
            "sprite-ownerstar-off",
            unstar
        );
    }

    function moveBuilder(node) {
        return menuBuilder(
            node,
            "move to trash (RO only)",
            "",
            movetotrash
        );
    }

    function graveyardBuilder(node) {
        return menuBuilder(
            node,
            "move to Grave Yard (RO only)",
            "",
            movetoGraveYard
        );
    }

    function addActions(node) {
        var prevNode,
            currentNode,
            i;

        for (i = 0; i < node.childNodes.length; i = i + 1) {
            currentNode = node.childNodes[i];
            if (currentNode.nodeType === 1 && currentNode.nodeName === 'SMALL') {
                if (prevNode.nodeName !== 'span') {
                    node.insertBefore(
                        unpinBuilder(node),
                        currentNode
                    );
                    node.insertBefore(
                        moveBuilder(node),
                        currentNode
                    );
                    node.insertBefore(
                        graveyardBuilder(node),
                        currentNode
                    );
                }
                break;
            } else {
                prevNode = currentNode;
            }
        }
    }

    function processMutationRecord(record) {
        var node,
            i;
        if (record.addedNodes) {
            for (i = 0; i < record.addedNodes.length; i = i + 1) {
                node = record.addedNodes[i];
                if (node.nodeType === 1 && node.nodeName === 'DIV' && node.className === 'popup') {
                    addActions(node);
                }
            }
        }
    }

    var mut = new MutationObserver(function (items, src) {
        var i;
        for (i = 0; i < items.length; i = i + 1) {
            processMutationRecord(items[i]);
        }
    });

    mut.observe(document.getElementById('transcript'), { childList: true, subtree: true });
}());