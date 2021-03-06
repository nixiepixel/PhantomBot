/*
 * Copyright (C) 2017 phantombot.tv
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/* 
 * @author IllusionaryOne
 */

/*
 * customCommandsPanel.js
 * Drives the Custom Commands Panel
 */
(function() {
    var modeIcon = [],
        groupIcons = [],
        globalCooldown = "",
        modCooldown = "",
        perUserCooldown = "",
        globalCooldownTime = "",
        cooldownMsg = "false",
        permcomMsg = "true",
        disabledCommands = [],
        commands = [],
        botCommands = [];

        modeIcon['false'] = "<i style=\"color: #6136b1\" class=\"fa fa-circle-o\" />";
        modeIcon['true'] = "<i style=\"color: #6136b1\" class=\"fa fa-circle\" />";

        groupIcons['0'] = "<i class=\"fa fa-television\" />";
        groupIcons['1'] = "<i class=\"fa fa-cog\" />";
        groupIcons['2'] = "<i class=\"fa fa-shield\" />";
        groupIcons['4'] = "<i class=\"fa fa-dollar\" />";
        groupIcons['3'] = "<i class=\"fa fa-credit-card\" />";
        groupIcons['6'] = "<i class=\"fa fa-clock-o\" />";
        groupIcons['7'] = "<i class=\"fa fa-user\" /></div>";

    /*
     * onMessage
     * This event is generated by the connection (WebSocket) object.
     * @param {String} message
     */
    function onMessage(message) {
        var msgObject;

        try {
            msgObject = JSON.parse(message.data);
        } catch (ex) {
            return;
        }

        // Check for dbkeysresult queries
        if (panelHasQuery(msgObject)) {
            var commandName = "",
                commandValue = "",
                html = "<table>",
                time = "",
                foundData = false;

            if (panelCheckQuery(msgObject, 'commands_cooldown')) {
                html = "<table>";
                for (idx in msgObject['results']) {
                    commandName = msgObject['results'][idx]['key'];
                    time = JSON.parse(msgObject['results'][idx]['value']).seconds;

                    foundData = true;
                    html += '<tr style="textList">' +
                    '    <td style="width: 10%" >!' + commandName + '</td>' +
                    '    <td style="vertical-align: middle">' +
                    '        <form onkeypress="return event.keyCode != 13">' +
                    '            <input style="width: 95%" type="text" data-toggle="tooltip" title="Click to edit the cooldown." onclick="$.editCooldown(\'' + commandName + '\', \'' + time + '\', \''+ JSON.parse(msgObject['results'][idx]['value']).isGlobal+ '\')"' +
                    '                       id="editCommandCooldown_' + commandName.replace(/[^a-zA-Z0-9_]/g, '_SP_') + '"' +
                    '                   value="' + time + ' seconds. (Global: ' + JSON.parse(msgObject['results'][idx]['value']).isGlobal + ')" />' +
                    '              <button style="float: right;" type="button" class="btn btn-default btn-xs" id="deleteCooldown_' + commandName + '" onclick="$.deleteCooldown(\'' + commandName + '\')"><i class="fa fa-trash" /> </button>' +
                    '             </form>' +
                    '        </form>' +
                    '    </td>' +
                    '</tr>';
                }
                html += "</table>";

                if (!foundData) {
                    html = "<i>No entries in cooldown table.</i>";
                }
                $("#cooldownList").html(html);   
            }

            if (panelCheckQuery(msgObject, 'commands_cooldownsettings')) {
                for (idx in msgObject['results']) {
                    commandName = msgObject['results'][idx]['key'];
                    time = msgObject['results'][idx]['value'];

                    if (panelMatch(commandName, 'modCooldown')) {
                        modCooldown = msgObject['results'][idx]['value'];
                        continue;
                    }

                    if (panelMatch(commandName, 'defaultCooldownTime')) {
                        $('#defaultCooldownInput').val(msgObject['results'][idx]['value']);
                        continue;
                    }
                }
                $("#toggleModCooldown").html(modeIcon[modCooldown]);
            }

            if (panelCheckQuery(msgObject, 'commands_cooldownmsg')) {
                if (msgObject['results']['coolDownMsgEnabled'] != null && msgObject['results']['coolDownMsgEnabled'] != undefined) {
                    cooldownMsg = msgObject['results']['coolDownMsgEnabled'];
                }
            }

            if (panelCheckQuery(msgObject, 'commands_permcommsg')) {
                if (msgObject['results']['permComMsgEnabled'] != null && msgObject['results']['permComMsgEnabled'] != undefined) {
                    permcomMsg = msgObject['results']['permComMsgEnabled'];
                }
            }

            $("#cooldownMsg").html(modeIcon[cooldownMsg]);
            $("#permcomMsg").html(modeIcon[permcomMsg]);

            if (panelCheckQuery(msgObject, 'commands_commands')) {
                if (msgObject['results'].length === 0) {
                    $('#customCommandsList').html('<i>There are no custom commands defined.</i>');
                    return;
                }

                html = '<table>';
                commands.splice(0);
                for (var idx in msgObject['results']) {
                    commandName = msgObject['results'][idx]['key'];
                    commandNameSafe = commandName.replace(/\?/g, '__QM__');
                    commandValue = msgObject['results'][idx]['value'];
                    commands.push(commandName);
                    commandValue = commandValue.replace(/"/g, "''");
                    html += '<tr style="textList">' +
                            '    <td style="width: 15%">!' + commandName + '</td>' +
                            '    <td style="vertical-align: middle">' +
                            '        <form onkeypress="return event.keyCode != 13">' +
                            '            <input style="width: 85%" type="text" id="editCommand_' + commandNameSafe.replace(/[^a-zA-Z0-9_]/g, '_SP_')  + '"' +
                            '                   value="' + commandValue + '" />' +
                            '              <button type="button" class="btn btn-default btn-xs" onclick="$.editCustomCommand(\'' + commandName + '\')"><i class="fa fa-pencil" /> </button> ' +
                            '              <button type="button" class="btn btn-default btn-xs" id="deleteCommand_' + commandNameSafe.replace(/[^a-zA-Z0-9_]/g, '_SP_') + '" onclick="$.deleteCommand(\'' + commandName + '\')"><i class="fa fa-trash" /> </button>' +
                            '             </form>' +
                            '        </form>' +
                            '    </td>' +
                            '</tr>';
                }
                html += '</table>';
                $('#customCommandsList').html(html);
                handleInputFocus();
            }

            if (panelCheckQuery(msgObject, 'commands_aliases')) {
                if (msgObject['results'].length === 0) {
                    $('#aliasCommandsList').html('<i>There are no aliased commands defined.</i>');
                    return;
                }
                for (idx in msgObject['results']) {
                    commandName = msgObject['results'][idx]['key'];
                    commandValue = msgObject['results'][idx]['value'];
                    html += "<tr class=\"textList\">" +
                            "    <td style=\"width: 5%\">" +
                            "        <div id=\"deleteAlias_" + commandName.replace(/[^a-zA-Z0-9_]/g, '_SP_') + "\" type=\"button\" class=\"btn btn-default btn-xs\" " +
                            "             onclick=\"$.deleteAlias('" + commandName + "')\"><i class=\"fa fa-trash\" />" +
                            "        </div>" +
                            "    </td>" +
                            "    <td>!" + commandValue + "</td>" +
                            "    <td>!" + commandName + "</td>" +
                            "</tr>";


                }
                html += "</table>";
                $("#aliasCommandsList").html(html);
            }

            if (panelCheckQuery(msgObject, 'commands_pricecom')) {
                if (msgObject['results'].length === 0) {
                    $('#priceCommandsList').html('<i>There are no commands with prices defined.</i>');
                    return;
                }
                for (idx in msgObject['results']) {
                    commandName = msgObject['results'][idx]['key'];
                    commandValue = msgObject['results'][idx]['value'];
                    html += '<tr style="textList">' +
                    '    <td style="width: 10%">!' + commandName + '</td>' +
                    '    <td style="vertical-align: middle">' +
                    '        <form onkeypress="return event.keyCode != 13">' +
                    '            <input style="width: 60%" type="text" id="editCommandPrice_' + commandName.replace(/[^a-zA-Z0-9_]/g, '_SP_') + '"' +
                    '                   value="' + commandValue + '" />' +
                    '              <button type="button" class="btn btn-default btn-xs" onclick="$.updateCommandPrice(\'' + commandName + '\')"><i class="fa fa-pencil" /> </button> ' +
                    '              <button type="button" class="btn btn-default btn-xs" id="deleteCommandPrice_' + commandName.replace(/[^a-zA-Z0-9_]/g, '_SP_') + '" onclick="$.deleteCommandPrice(\'' + commandName + '\')"><i class="fa fa-trash" /> </button>' +
                    '             </form>' +
                    '        </form>' +
                    '    </td>' +
                    '</tr>';
                }
                html += "</table>";
                $("#priceCommandsList").html(html);
                handleInputFocus();
            }

            if (panelCheckQuery(msgObject, 'commands_payment')) {
                if (msgObject['results'].length === 0) {
                    $('#payCommandsList').html('<i>There are no commands with payments defined.</i>');
                    return;
                }
                for (idx in msgObject['results']) {
                    commandName = msgObject['results'][idx]['key'];
                    commandValue = msgObject['results'][idx]['value'];
                    html += '<tr style="textList">' +
                    '    <td style="width: 10%">!' + commandName + '</td>' +
                    '    <td style="vertical-align: middle">' +
                    '        <form onkeypress="return event.keyCode != 13">' +
                    '            <input style="width: 60%" type="text" id="editCommandPay_' + commandName.replace(/[^a-zA-Z0-9_]/g, '_SP_') + '"' +
                    '                   value="' + commandValue + '" />' +
                    '              <button type="button" class="btn btn-default btn-xs" onclick="$.updateCommandPay(\'' + commandName + '\')"><i class="fa fa-pencil" /> </button> ' +
                    '              <button type="button" class="btn btn-default btn-xs" id="deleteCommandPay_' + commandName.replace(/[^a-zA-Z0-9_]/g, '_SP_') + '" onclick="$.deleteCommandPay(\'' + commandName + '\')"><i class="fa fa-trash" /> </button>' +
                    '             </form>' +
                    '        </form>' +
                    '    </td>' +
                    '</tr>';
                }
                html += "</table>";
                $("#payCommandsList").html(html);
                handleInputFocus();
            }

            if (panelCheckQuery(msgObject, 'commands_disabled')) {
                disabledCommands = [];
                for (idx in msgObject['results']) {
                    disabledCommands[msgObject['results'][idx]['key']] = true;
                }
              sendDBKeys("commands_permcom", "permcom");
            }

            if (panelCheckQuery(msgObject, 'commands_permcom')) {
                var commandTableData = msgObject['results'],
                    botCommandsNew = [];

                commandTableData.sort(sortCommandTable);

                for (idx in commandTableData) {
                    commandName = commandTableData[idx]['key'];
                    commandValue = commandTableData[idx]['value'];
                    botCommandsNew.push(commandName);
                    html += "<tr class=\"textList\">" +
                            "<td><strong>" + commandName + "</strong></td>";

                    if (commandName.indexOf(' ') === -1) {
                        if (disabledCommands[commandName] !== undefined) {
                            html +=  "<td><div id=\"commandEnabled_" + commandName + "\"" +
                                     "         data-toggle=\"tooltip\" title=\"Enable Command\" class=\"button\" onclick=\"$.commandEnable('" + commandName + "', 'enable');\">" +
                                     "    <i style=\"color: #6136b1\" class=\"fa fa-toggle-off\" /></div></td>";
                        } else {
                            html +=  "<td><div id=\"commandEnabled_" + commandName + "\"" +
                                     "         data-toggle=\"tooltip\" title=\"Disable Command\" class=\"button\" onclick=\"$.commandEnable('" + commandName + "', 'disable');\">" +
                                     "    <i style=\"color: #6136b1\" class=\"fa fa-toggle-on\" /></div></td>";
                        }
                    } else {
                        html += "<td />";
                    }

                    html += "<td /><td><div id=\"commandsList_" + commandName + "\"><strong><font style=\"color: #6136b1\">" + groupIcons[commandValue] + 
                            "    </font></strong></div></td>" +

                            "<td><div data-toggle=\"tooltip\" title=\"Set Caster\" class=\"button\" onclick=\"$.commandPermission('" + commandName + "', 0);\">" +
                            "    <i class=\"fa fa-television\" /></div></td>" +

                            "<td><div data-toggle=\"tooltip\" title=\"Set Admin\" class=\"button\" onclick=\"$.commandPermission('" + commandName + "', 1);\">" +
                            "    <i class=\"fa fa-cog\" /></div></td>" +

                            "<td><div data-toggle=\"tooltip\" title=\"Set Mod\" class=\"button\" onclick=\"$.commandPermission('" + commandName + "', 2);\">" +
                            "    <i class=\"fa fa-shield\" /></div></td>" +

                            "<td><div data-toggle=\"tooltip\" title=\"Set Donator\" class=\"button\" onclick=\"$.commandPermission('" + commandName + "', 4);\">" +
                            "    <i class=\"fa fa-dollar\" /></div></td>" +

                            "<td><div data-toggle=\"tooltip\" title=\"Set Sub\" class=\"button\" onclick=\"$.commandPermission('" + commandName + "', 3);\">" +
                            "    <i class=\"fa fa-credit-card\" /></div></td>" +

                            "<td><div data-toggle=\"tooltip\" title=\"Set Regular\" class=\"button\" onclick=\"$.commandPermission('" + commandName + "', 6);\">" +
                            "    <i class=\"fa fa-clock-o\" /></div></td>" +

                            "<td><div data-toggle=\"tooltip\" title=\"Set Viewer\" class=\"button\" onclick=\"$.commandPermission('" + commandName + "', 7);\">" +
                            "    <i class=\"fa fa-user\" /></div></td>" +

                            "</tr>";
                }
                botCommands = botCommandsNew.slice();
                html += "</table>";
                $("#permCommandsList").html(html);
                $('[data-toggle="tooltip"]').tooltip();
            }
        }
    }

    /**
     * @function doQuery
     */
    function doQuery() {
        sendDBKeys("commands_commands", "command");
        sendDBKeys("commands_aliases", "aliases");
        sendDBKeys("commands_pricecom", "pricecom");
        sendDBKeys("commands_payment", "paycom");
        sendDBKeys("commands_cooldown", "cooldown");
        sendDBKeys("commands_cooldownsettings", "cooldownSettings");
        sendDBKeys("commands_disabled", "disabledCommands");
        sendDBQuery("commands_cooldownmsg", "settings", "coolDownMsgEnabled");
        sendDBQuery("commands_permcommsg", "settings", "permComMsgEnabled");
    };

    /**
     * @function sortCommandTable
     * @param {Object} a
     * @param {Object} b
     */
    function sortCommandTable(a, b) {
        return panelStrcmp(a.key, b.key);
    };

    /** 
     * @function deleteCommand
     * @param {String} command
     */
    function deleteCommand(command) {
        $("#deleteCommand_" + command.replace(/[^a-zA-Z0-9_]/g, '_SP_')).html("<i style=\"color: #6136b1\" class=\"fa fa-spinner fa-spin\" />");
        command = command.toLowerCase();
        sendDBDelete("commands_delcom_" + command, "command", command);
        sendDBDelete("commands_delcompermcom_" + command, "permcom", command);
        sendDBDelete("commands_delcompricecom_" + command, "pricecom", command);
        sendDBDelete("commands_delcompermcom_" + command, "permcom", command);
        sendDBDelete("commands_delcomalias_" + command, "aliases", command);
        sendDBDelete("commands_delcomcooldown_" + command, "cooldown", command);
        sendWSEvent('commands', './commands/customCommands.js', null, ['remove', command]);
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
        setTimeout(function() { sendCommand("reloadcommand " + command); }, TIMEOUT_WAIT_TIME);
    };

    /** 
     * @function deleteCommandPrice
     * @param {String} command
     */
    function deleteCommandPrice(command) {
        $("#deleteCommandPrice_" + command.replace(/[^a-zA-Z0-9_]/g, '_SP_')).html("<i style=\"color: #6136b1\" class=\"fa fa-spinner fa-spin\" />");
        sendDBDelete("commands_delcomprice_" + command, "pricecom", command);
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
        setTimeout(function() { sendCommand("reloadcommand") }, TIMEOUT_WAIT_TIME);
    };

    /** 
     * @function deleteCommandPay
     * @param {String} command
     */
    function deleteCommandPay(command) {
        $("#deleteCommandPay_" + command.replace(/[^a-zA-Z0-9_]/g, '_SP_')).html("<i style=\"color: #6136b1\" class=\"fa fa-spinner fa-spin\" />");
        sendDBDelete("commands_delcompay_" + command, "paycom", command);
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
        setTimeout(function() { sendCommand("reloadcommand") }, TIMEOUT_WAIT_TIME);
    };

    /**
     * @function addCustomCommand
     */
    function addCustomCommand() {
        var command = $('#addCommandCommand').val();
        var commandText = $('#addCommandText').val();

        if (command.length == 0) {
            $('#addCommandCommand').val('[ERROR] Please enter a value.');
            $('#addCommandText').val('');
            setTimeout(function() { $('#addCommandCommand').val(''); }, TIMEOUT_WAIT_TIME * 10);
            return;
        } else if (commandText.length == 0) {
            $('#addCommandText').val('[ERROR] Please enter a value.');
            $('#addCommandCommand').val('');
            setTimeout(function() { $('#addCommandText').val(''); }, TIMEOUT_WAIT_TIME * 10);
            return;
        } else if (command.match(/\s+/)) {
            $('#addCommandCommand').val('[ERROR] Your command cannot contain a space.');
            $('#addCommandText').val('');
            setTimeout(function() { $('#addCommandCommand').val(''); }, TIMEOUT_WAIT_TIME * 10);
            return;
        } else if (botCommands.indexOf(command) !== -1) {
            $('#addCommandCommand').val('[ERROR] Command already exists.');
            $('#addCommandText').val('');
            setTimeout(function() { $('#addCommandCommand').val(''); }, TIMEOUT_WAIT_TIME * 10);
            return;
        }

        command = command.replace('!', '');

        $('#addCommandText').val('Command successfully added!'); 
        sendDBUpdate('addCustomCommand', 'command', command.toLowerCase(), commandText);
        sendWSEvent('commands', './commands/customCommands.js', null, ['add', command, commandText]);
        setTimeout(function() { 
            $('#addCommandText').val(''); 
            $('#addCommandCommand').val(''); 
            sendCommand('reloadcommand'); 
            doQuery(); 
        }, TIMEOUT_WAIT_TIME);
    };

    /**
     * @function editCustomCommand
     * @param {String} command
     */
    function editCustomCommand(command) {
    var value = $('#editCommand_' + command.replace(/\?/g, '__QM__').replace(/[^a-zA-Z0-9_]/g, '_SP_')).val();
    value = value.replace(/''/g, '"');
        if (value.length > 0) {
            command = command.replace('!', '');
            sendDBUpdate("addCustomCommand", "command", command.toLowerCase(), value);
            sendWSEvent('commands', './commands/customCommands.js', null, ['edit', command.toLowerCase(), value]);
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
            setTimeout(function() { sendCommand("reloadcommand"); }, TIMEOUT_WAIT_TIME);
        }
    };

    /** 
     * @function aliasCommand
     */
    function aliasCommand() {
        var main = $('#aliasCommandInput').val();
        var alias = $('#aliasCommandInputAlias').val();

        if (alias.length == 0) {
            $("#aliasCommandInputAlias").val("[ERROR] Please enter a value.");
            setTimeout(function() { $("#aliasCommandInputAlias").val(""); }, TIMEOUT_WAIT_TIME * 2);
            return;
        } else if (main.length == 0) {
            $("#aliasCommandInput").val("[ERROR] Please enter a value.");
            setTimeout(function() { $("#aliasCommandInput").val(""); }, TIMEOUT_WAIT_TIME * 2);
            return;
        }

        alias = alias.replace('!', '');
        main = main.replace('!', '');
        sendDBUpdate("addCommandAlias", "aliases", main.toLowerCase(), alias.toLowerCase());
        setTimeout(function() { $('#aliasCommandInput').val(""); $('#aliasCommandInputAlias').val(""); sendCommand("reloadcommand"); }, TIMEOUT_WAIT_TIME);
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
    };

    /**
     * @function deleteAlias
     * @param {String} command
     */
    function deleteAlias(command) {
        $("#deleteAlias_" + command.replace(/[^a-zA-Z0-9_]/g, '_SP_')).html("<i style=\"color: #6136b1\" class=\"fa fa-spinner fa-spin\" />");
        if (command.length != 0) {
            command = command.replace('!', '');
            sendDBDelete("commands_delalias_" + command, "aliases", command);
        }
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
        setTimeout(function() { sendCommand("reloadcommand " + command); }, TIMEOUT_WAIT_TIME);
    };

    /**
     * @function commandPermission
     */
    function commandPermission(command, group) {
        $("#commandsList_" + command.replace(/[^a-zA-Z0-9_]/g, '_SP_')).html("<i style=\"color: #6136b1\" class=\"fa fa-spinner fa-spin\" />");
        if (command.length != 0 && group.length != 0) {
            command = command.replace('!', '');
            sendCommand('permcomsilent ' + command.toLowerCase() + ' ' + String(group))
            //sendDBUpdate("commands_permcom", "permcom", command.toLowerCase(), String(group));
        }
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
        setTimeout(function() { sendCommand("reloadcommand"); }, TIMEOUT_WAIT_TIME);
    };

    /**
     * @function setCommandPrice
     */
    function setCommandPrice() {
        var price = $("#setCommandPriceInput").val();
        var com = $("#setCommandPriceInputCommand").val();

        if (com.startsWith('!')) {
            com = com.replace('!', '');
        }

        if (price.length != 0 && com.length != 0) {
            sendDBUpdate("commandPrice", "pricecom", com.toLowerCase(), price);
            $("#setCommandPriceInput").val("");
            $("#setCommandPriceInputCommand").val("");
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
        }
    };

    /**
     * @function setCommandPay
     */
    function setCommandPay() {
        var price = $("#setCommandPayInput").val();
        var com = $("#setCommandPayInputCommand").val();

        if (com.startsWith('!')) {
            com = com.replace('!', '');
        }

        if (price != 0 && com.length != 0) {
            sendDBUpdate("commandPay", "paycom", com.toLowerCase(), price);
            $("#setCommandPayInput").val("");
            $("#setCommandPayInputCommand").val("");
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
        }
    };

    /**
     * @function updateCommandPrice
     */
    function updateCommandPrice(command) {
        var val = $('#editCommandPrice_' + command.replace(/[^a-zA-Z0-9_]/g, '_SP_')).val();
        $('#editCommandPrice_' + command.replace(/[^a-zA-Z0-9_]/g, '_SP_')).html("<i style=\"color: #6136b1\" class=\"fa fa-spinner fa-spin\" />");
        if (val > 0) {
            sendDBUpdate("commands_editprice_" + command, "pricecom", command.toLowerCase(), val);
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
            setTimeout(function() { sendCommand("reloadcommand"); }, TIMEOUT_WAIT_TIME);
        }
    };

    /**
     * @function updateCommandPay
     */
    function updateCommandPay(command) {
        var val = $('#editCommandPay_' + command.replace(/[^a-zA-Z0-9_]/g, '_SP_')).val();
        $('#editCommandPay_' + command.replace(/[^a-zA-Z0-9_]/g, '_SP_')).html("<i style=\"color: #6136b1\" class=\"fa fa-spinner fa-spin\" />");
        if (val.length > 0) {
            sendDBUpdate("commands_editpay_" + command, "paycom", command.toLowerCase(), val);
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
            setTimeout(function() { sendCommand("reloadcommand"); }, TIMEOUT_WAIT_TIME);
        }
    };

    /**
     * @function toggleCooldownMsg
     */
    function toggleCooldownMsg() {
        $("#cooldownMsg").html("<i style=\"color: #6136b1\" class=\"fa fa-spinner fa-spin\" />");
        if (cooldownMsg == "true") {
            sendDBUpdate("commands_cooldownmsg", "settings", "coolDownMsgEnabled", "false");
        } else if (cooldownMsg == "false") {
            sendDBUpdate("commands_cooldownmsg", "settings", "coolDownMsgEnabled", "true");
        }
        sendCommand('reloadinit');
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME * 2);
    };

    /**
     * @function togglePermcomMsg
     */
    function togglePermcomMsg() {
        $("#permcomMsg").html("<i style=\"color: #6136b1\" class=\"fa fa-spinner fa-spin\" />");
        if (permcomMsg == "true") {
            sendDBUpdate("commands_permcommsg", "settings", "permComMsgEnabled", "false");
        } else if (permcomMsg == "false") {
            sendDBUpdate("commands_permcommsg", "settings", "permComMsgEnabled", "true");
        }
        sendCommand('reloadinit');
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME * 2);
    };

    /**
     * @function toggleModCooldown
     */
    function toggleModCooldown() {
        $("#toggleModCooldown").html("<i style=\"color: #6136b1\" class=\"fa fa-spinner fa-spin\" />");
        if (modCooldown == "true") {
            sendDBUpdate("commands_cooldown_toggle", "cooldownSettings", "modCooldown", "false");
        } else if (modCooldown == "false") {
            sendDBUpdate("commands_cooldown_toggle", "cooldownSettings", "modCooldown", "true");
        }
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME * 2);
        setTimeout(function() { sendCommand("reloadcooldown"); }, TIMEOUT_WAIT_TIME * 2);
    };

    /**
     * @function setGlobalCooldownTime
     */
    function setDefaultCooldown() {
        var newValue = $("#defaultCooldownInput").val();
        if (newValue.length > 0) {
            sendDBUpdate("commands_cooldown_time", "cooldownSettings", "defaultCooldownTime", String(newValue));
            setTimeout(function() { doQuery();  }, TIMEOUT_WAIT_TIME * 2);
        }
    }

    /**
     * @function deleteCooldown
     * @param {String} command
     */
    function deleteCooldown(command) {
        $("#deleteCooldown_" + command.replace(/[^a-zA-Z0-9_]/g, '_SP_')).html("<i style=\"color: #6136b1\" class=\"fa fa-spinner fa-spin\" />");
        sendDBDelete("commands_cooldown_delete", "cooldown", command);
        sendWSEvent('cooldown', './core/commandCoolDown.js', null, ['remove', command]);
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
    }

    /**
     * @function addCooldown
     */
    function addCooldown() {
        var input = $("#cooldownCmdInput").val();
        var command = $("#cooldownCmdInputCommand").val();
        var checked = $("#globalCooldownCheck").is(':checked');

        if (command.startsWith('!')) {
            command = command.replace('!', '');
        }

        if (command.match(/\s/)) {
            $("#cooldownCmdInputCommand").val("Cooldowns cannot have a space, please set the cooldown on the default command.");
            setTimeout(function() { $("#cooldownCmdInputCommand").val(""); $("#cooldownCmdInput").val(""); $("#globalCooldownCheck").prop('checked', true); }, TIMEOUT_WAIT_TIME * 3);
            return;
        }
        
        if (input.length > 0 && command.length != 0) {
            sendDBUpdate("commands_cooldown_add", "cooldown", String(command), JSON.stringify({command: String(command.toLowerCase()), seconds: String(input), isGlobal: String(checked)}));
            setTimeout(function() { doQuery(); sendWSEvent('cooldown', './core/commandCoolDown.js', null, ['add', command.toLowerCase(), input, checked]); }, TIMEOUT_WAIT_TIME);
            setTimeout(function() { $("#cooldownCmdInputCommand").val(""); $("#cooldownCmdInput").val(""); $("#globalCooldownCheck").prop('checked', true); }, 5);
        }
    }

    function editCooldown(command, time, global) {
        $("#cooldownCmdInput").val(time);
        $("#cooldownCmdInputCommand").val(command);
        $("#cooldownCmdInputCommand").focus();
        $("#globalCooldownCheck").prop('checked', global == 'true');
    }

    /**
     * @function commandEnable
     * @param {String} commandName
     * @param {String} action
     */
    function commandEnable(commandName, action) {
        if (panelMatch(action, 'enable')) {
            $('#commandEnabled_' + commandName).html('<i style="color: #333333" class="fa fa-toggle-on" />');
            sendDBDelete('commands_enablecom', 'disabledCommands', commandName);
            sendCommand('registerpanel ' + commandName);
        } else {
            $('#commandEnabled_' + commandName).html('<i style="color: #333333" class="fa fa-toggle-off" />');
            sendDBUpdate('commands_enablecom', 'disabledCommands', commandName, 'true');
            sendCommand('unregisterpanel ' + commandName);
        }
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
    }

    /**
     * @function runCommand
     */
    function runCustomCommand() {
        var val = $('#commandImput').val();

        if (val.length == 0) {
            $('#commandImput').val('');
            return;
        }

        sendCommand(val.replace('!', ''));
        $('#commandImput').val('command sent!');
        setTimeout(function() { $('#commandImput').val('') }, TIMEOUT_WAIT_TIME);
    }

    // Import the HTML file for this panel.
    $("#commandsPanel").load("/panel/commands.html");

    // Load the DB items for this panel, wait to ensure that we are connected.
    var interval = setInterval(function() {
        if (isConnected && TABS_INITIALIZED) {
            var active = $("#tabs").tabs("option", "active");
            if (active == 1) {
                doQuery();
                clearInterval(interval);
            }
        }
    }, INITIAL_WAIT_TIME);

    // Query the DB every 30 seconds for updates.
    setInterval(function() {
        var active = $("#tabs").tabs("option", "active");
        if (active == 1 && isConnected && !isInputFocus()) {
            newPanelAlert('Refreshing Commands Data', 'success', 1000);
            doQuery();
        }
    }, 3e4);

    // Export functions - Needed when calling from HTML.
    $.commandsOnMessage = onMessage;
    $.commandsDoQuery = doQuery;
    $.deleteCommand = deleteCommand;
    $.addCustomCommand = addCustomCommand;
    $.editCustomCommand = editCustomCommand;
    $.aliasCommand = aliasCommand;
    $.deleteAlias = deleteAlias;
    $.commandPermission = commandPermission;
    $.setCommandPrice = setCommandPrice;
    $.setCommandPay = setCommandPay;
    $.updateCommandPrice = updateCommandPrice;
    $.updateCommandPay = updateCommandPay;
    $.addCooldown = addCooldown;
    $.deleteCooldown = deleteCooldown;
    $.toggleModCooldown = toggleModCooldown;
    $.setDefaultCooldown = setDefaultCooldown;
    $.commandEnable = commandEnable;
    $.deleteCommandPrice = deleteCommandPrice;
    $.deleteCommandPay = deleteCommandPay;
    $.commands = commands;
    $.runCustomCommand = runCustomCommand;
    $.toggleCooldownMsg = toggleCooldownMsg;
    $.togglePermcomMsg = togglePermcomMsg;
    $.editCooldown = editCooldown;
})();
