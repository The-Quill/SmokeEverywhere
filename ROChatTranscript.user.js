// ==UserScript==
// @name         Unstar/unpin/delete for room owners
// @namespace    http://stackoverflow.com/users/578411/rene
// @version      0.1
// @description  RO Transcript
// @author       rene
// @match        *://chat.stackoverflow.com/transcript/*
// @match        *://chat.stackexchange.com/transcript/*
// @match        *://chat.meta.stackexchange.com/transcript/*
// @grant        none
// ==/UserScript==

/*global $:false, alert:false, MutationObserver:false */

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

    // moves the message found in a node to the Trash room
    function movetotrash(node) {
        var fkey = document.getElementById('fkey').value,
            id = node.parentElement.id.split('-')[1],
            target = 48058, /* hardcoded the Trash Room on SO for now */
            href = $(node.parentElement).find('a'),
            re = /(?:\w|[.\/:])*\/transcript\/(\d+)/,
            matches;
        if (href.length > 0) {
            matches = re.exec($(href[0]).prop('href'));
            if (matches !== null && matches.length > 1) {
                $.ajax({
                    type: 'POST',
                    data: 'ids=' + id + '&to=' + target + '&fkey=' + fkey,
                    url: '/admin/movePosts/' + matches[1]
                });
            }
        }
    }

    // add an extra item to the dialog
    function unpinBuilder(node) {
        var outer = document.createElement('span'),
            sprite = document.createElement('span'),
            text = document.createTextNode("unpin/cancel stars (RO only)");

        sprite.className = "sprite sprite-ownerstar-off";
        outer.className = "star";
        outer.appendChild(sprite);
        outer.appendChild(text);

        outer.addEventListener(
            "click",
            function () {
                unstar(node);
            },
            false
        );
        return outer;
    }

    // add an move to trash item to the dialog
    function moveBuilder(node) {
        var outer = document.createElement('span'),
            sprite = document.createElement('span'),
            text = document.createTextNode("move to trash (RO only)");

        sprite.className = "sprite ";
        outer.className = "";
        outer.appendChild(sprite);
        outer.appendChild(text);

        outer.addEventListener(
            "click",
            function () {
                movetotrash(node);
            },
            false
        );
        return outer;
    }

    // adds all possible RO actions to the dialog
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
                }
                break;
            } else {
                prevNode = currentNode;
            }
        }
    }

    // handles mutations
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

    // listen for mutations
    var mut = new MutationObserver(function (items, src) {
        var i;
        for (i = 0; i < items.length; i = i + 1) {
            processMutationRecord(items[i]);
        }
    });

    mut.observe(document.getElementById('transcript'), { childList: true, subtree: true });
}());