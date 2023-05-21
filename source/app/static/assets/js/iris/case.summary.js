/* global ace */
/* global $ */

import '../ace.combined.js';

import { 
    load_menu_mod_options_modal, 
    get_caseid, 
    notify_success,
    random_filename,
    upload_interactive_data,
    case_param, 
    notify_error, 
    get_request_api, 
    ajax_notify_error, 
    get_showdown_convert,
    do_md_filter_xss, 
    setOnClickEventFromMap
} from './common';

import { crc32 } from './crc32.utils';
import { edit_case_info } from './manage.cases.common';
import swal from 'sweetalert';
import io from 'socket.io-client';

import endpoints from './api.map';

let collaborator = null;
let last_applied_change = null;
let just_cleared_buffer = false;
let from_sync = false;

/**
 * Namespace for summary events.
 */
const summaryEventNamespace = "summaryEventNamespace";

/**
 * Namespace for summary click events.
 */
const summaryClickEventNamespace = `click.${summaryEventNamespace}`;

/**
 * Map of summary events and their corresponding functions.
 */
const summaryEventsMap = {
    ".summary-case-details-btn": function() {wrapCaseDetails(true);}, 
    "#summaryEditBtn": function() {edit_case_summary();}, 
    "#summarySyncEditor": function() {sync_editor();}
}

/**
 * Displays the details of a case in a modal dialog.
 * 
 * @param {number} case_id - The ID of the case to display details for.
 * @param {boolean} edit_mode - Whether to display the case details in edit mode.
 */
function wrapCaseDetails(edit_mode = false) {
    // Check if the element has an edit attribute and set edit_mode accordingly
    let has_edit = $(this).data('edit');
    if (has_edit !== undefined) {
        edit_mode = $(this).data('edit');
        console.log("edit_mode: " + edit_mode);
    }

    // Display the case details in a modal dialog
    if ($(this).data('case-id') !== undefined) {
        case_detail($(this).data('case-id'), edit_mode);
    } else {
        case_detail(get_caseid(), edit_mode);
    }
}

/**
 * Initializes a Collaborator object with a given session ID and sets up a socket connection to the server.
 * 
 * @param {string} session_id - The session ID to use for the collaboration channel.
 */
function Collaborator(session_id) {
    // Set up a socket connection to the server for collaboration
    this.collaboration_socket = io.connect();

    // Set the channel for the collaboration socket to the given session ID
    this.channel = "case-" + session_id;

    // Join the collaboration channel
    this.collaboration_socket.emit('join', { 'channel': this.channel });

    // Listen for changes to the editor content from other collaborators
    this.collaboration_socket.on("change", function(data) {
        // Parse the delta data and apply it to the editor
        let delta = JSON.parse(data.delta);
        last_applied_change = delta;
        $("#content_typing").text(data.last_change + " is typing..");
        editor.getSession().getDocument().applyDeltas([delta]);
    }.bind());

    // Listen for a request to clear the editor buffer
    this.collaboration_socket.on("clear_buffer", function() {
        just_cleared_buffer = true;
        console.log("setting editor empty");
        editor.setValue("");
    }.bind());

    // Listen for a request to save the editor content
    this.collaboration_socket.on("save", function(data) {
        // Update the last saved by information and sync the editor content
        $("#content_last_saved_by").text("Last saved by " + data.last_saved);
        sync_editor(true);
    }.bind());
}

/**
 * Initializes an Ace editor with the given options and sets up Collaborator methods for changing, clearing, and saving the editor content.
 */
var editor = ace.edit("editor_summary", {
    autoScrollEditorIntoView: true,
    minLines: 4
});

/**
 * Sends a change event to the collaboration socket with the given delta data.
 * 
 * @param {Object} delta - The delta data to send to the collaboration socket.
 */
Collaborator.prototype.change = function(delta) {
    this.collaboration_socket.emit("change", { 'delta': delta, 'channel': this.channel });
}

/**
 * Sends a clear buffer event to the collaboration socket.
 */
Collaborator.prototype.clear_buffer = function() {
    this.collaboration_socket.emit("clear_buffer", { 'channel': this.channel });
}

/**
 * Sends a save event to the collaboration socket.
 */
Collaborator.prototype.save = function() {
    this.collaboration_socket.emit("save", { 'channel': this.channel });
}

/**
 * Initializes the Ace editor and sets up a Collaborator object for real-time collaboration.
 */
function body_loaded() {
    // Create a new Collaborator object with the current case ID
    collaborator = new Collaborator(get_caseid());

    // Register a change event listener on the editor to send changes to the collaboration socket
    from_sync = true;
    editor.on("change", function(e) {
        if (last_applied_change != e && editor.curOp && editor.curOp.command.name) {
            collaborator.change(JSON.stringify(e));
        }
    }, false);

    // Set the block scrolling property of the editor to infinity
    editor.$blockScrolling = Infinity;

    // Set focus on the first textarea element in the document
    document.getElementsByTagName('textarea')[0].focus();
    last_applied_change = null;
    just_cleared_buffer = false;
}

/**
 * Handles a paste event on the editor by uploading the pasted file to the datastore and inserting a markdown image link into the editor.
 * 
 * @param {Event} event - The paste event to handle.
 */
function handle_ed_paste(event) {
    let filename = null;
    const { items } = event.originalEvent.clipboardData;
    for (let i = 0; i < items.length; i += 1) {
        const item = items[i];

        // If the item is a string, set the filename to the trimmed string value
        if (item.kind === 'string') {
            item.getAsString(function (s){
                filename = $.trim(s.replace(/\t|\n|\r/g, '')).substring(0, 40);
            });
        }

        // If the item is a file, upload it to the datastore and insert a markdown image link into the editor
        if (item.kind === 'file') {
            const blob = item.getAsFile();

            if (blob !== null) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    // Notify the user that the file is uploading
                    notify_success('The file is uploading in background. Don\'t leave the page');

                    // If a filename was not set, generate a random filename
                    if (filename === null) {
                        filename = random_filename(25);
                    }

                    // Upload the file to the datastore and insert a markdown image link into the editor
                    upload_interactive_data(e.target.result, filename, function(data){
                        let url = data.data.file_url + case_param();
                        event.preventDefault();
                        editor.insertSnippet(`\n![${filename}](${url} =40%x40%)\n`);
                    });

                };
                reader.readAsDataURL(blob);
            } else {
                // Notify the user that the item is not supported for direct paste and should be uploaded to the datastore
                notify_error('Unsupported direct paste of this item. Use datastore to upload.');
            }
        }
    }
}

/**
 * Displays a modal dialog to select a report template.
 */
function report_template_selector() {
    $('#modal_select_report').modal({ show: true });
}

/**
 * Generates an investigation report with the selected report template.
 * 
 * @param {boolean} safe - Whether to generate a safe report or not.
 */
function gen_report(safe) {
    let url = endpoints.case.report.gen_investigation + $("#select_report option:selected").val() + case_param();
    if (safe === true) {
        url += '&safe=true';
    }
    window.open(url, '_blank');
}

/**
 * Generates an activities report with the selected report template.
 * 
 * @param {boolean} safe - Whether to generate a safe report or not.
 */
function gen_act_report(safe) {
    let url = endpoints.case.report.gen_activities + $("#select_report_act option:selected").val() + case_param();
    if (safe === true) {
        url += '&safe=true';
    }
    window.open(url, '_blank');
}

/**
 * Displays a modal dialog to select an activities report template.
 */
function act_report_template_selector() {
    $('#modal_select_report_act').modal({ show: true });
}

/**
 * Toggles the visibility of the case summary editor and updates the corresponding buttons and layout.
 */
function edit_case_summary() {
    // Toggle the visibility of the case summary editor
    $('#container_editor_summary').toggle();

    // Update the layout and buttons based on the visibility of the editor
    if ($('#container_editor_summary').is(':visible')) {
        $('#ctrd_casesum').removeClass('col-md-12').addClass('col-md-6');
        $('#summary_edition_btn').show(100);
        $("#summarySyncEditor").html('Save');
        $("#summaryEditBtn").html('Cancel');
    } else {
        $('#ctrd_casesum').removeClass('col-md-6').addClass('col-md-12');
        $('#summary_edition_btn').hide();
        $("#summarySyncEditor").html('Refresh');
        $("#summaryEditBtn").html('Edit');
    }
}

/* sync_editor
* Save the editor state.
* Check if there are external changes first.
* Copy local changes if conflict
*/
function sync_editor(no_check) {

    $('#last_saved').text('Syncing..').addClass('badge-danger').removeClass('badge-success');

    get_request_api(endpoints.case.summary.get)
    .done((data) => {
        if (data.status == 'success') {
            if (no_check) {
                // Set the content from remote server
                from_sync = true;
                editor.getSession().setValue(data.data.case_description);

                // Set the CRC in page
                $('#fetched_crc').val(data.data.crc32.toString());
                $('#last_saved').text('Changes saved').removeClass('badge-danger').addClass('badge-success');
                $('#content_last_sync').text("Last synced: " + new Date().toLocaleTimeString());
            }
            else {
                // Check if content is different
                let st = editor.getSession().getValue();
                let local_crc = '';
                if (data.data.crc32 != $('#fetched_crc').val()) {
                    // Content has changed remotely
                    // Check if we have changes locally
                    local_crc = crc32(st).toString();
                    console.log('Content changed. Local CRC is ' + local_crc);
                    console.log('Saved CRC is ' + $('#fetched_crc').val());
                    console.log('Remote CRC is ' + data.data.crc32);
                    if (local_crc == $('#fetched_crc').val()) {
                        // No local change, we can sync and update local CRC
                        editor.getSession().setValue(data.data.case_description);
                        $('#fetched_crc').val(data.data.crc32);
                        $('#last_saved').text('Changes saved').removeClass('badge-danger').addClass('badge-success');
                        $('#content_last_sync').text("Last synced: " + new Date().toLocaleTimeString());
                    } else {
                        // We have a conflict
                        $('#last_saved').text('Conflict !').addClass('badge-danger').removeClass('badge-success');
                        swal ( "Oh no !" ,
                        "We have a conflict with the remote content.\nSomeone may just have changed the description at the same time.\nThe local content will be copied into clipboard and content will be updated with remote." ,
                        "error"
                        ).then(() => {
                            // Old fashion trick
                            editor.selectAll();
                            editor.focus();
                            document.execCommand('copy');
                            editor.getSession().setValue(data.data.desc);
                            $('#fetched_crc').val(data.data.crc32);
                            notify_success('Content updated with remote. Local changes copied to clipboard.');
                            $('#content_last_sync').text("Last synced: " + new Date().toLocaleTimeString());
                        });
                    }
                } else {
                    // Content did not change remotely
                    // Check local change
                    local_crc = crc32(st).toString();
                    if (local_crc != $('#fetched_crc').val()) {
                        console.log('Local change. Old CRC is ' + local_crc);
                        console.log('New CRC is ' + $('#fetched_crc').val());
                        var data_req = Object();
                        data_req['case_description'] = st;
                        data_req['csrf_token'] = $('#csrf_token').val();
                        // Local change detected. Update to remote
                        $.ajax({
                            url: endpoints.case.summary.set + case_param(),
                            type: "POST",
                            dataType: "json",
                            contentType: "application/json;charset=UTF-8",
                            data: JSON.stringify(data_req),
                            success: function (data_received) {
                                if (data_received.status == 'success') {
                                    collaborator.save();
                                    $('#content_last_sync').text("Last synced: " + new Date().toLocaleTimeString());
                                    $('#fetched_crc').val(data_received.data);
                                    $('#last_saved').text('Changes saved').removeClass('badge-danger').addClass('badge-success');
                                } else {
                                    notify_error("Unable to save content to remote server");
                                    $('#last_saved').text('Error saving !').addClass('badge-danger').removeClass('badge-success');
                                }
                            },
                            error: function(error) {
                                notify_error(error.responseJSON.message);
                                ('#last_saved').text('Error saving !').addClass('badge-danger').removeClass('badge-success');
                            }
                        });
                    }
                    $('#content_last_sync').text("Last synced: " + new Date().toLocaleTimeString());
                    $('#last_saved').text('Changes saved').removeClass('badge-danger').addClass('badge-success');
                }
            }
        }
    });
}


/**
 * Tracks the current typing status and removes the typing indicator if the status hasn't changed.
 */
let is_typing = "";
function auto_remove_typing() {
    if ($("#content_typing").text() == is_typing) {
        $("#content_typing").text("");
    } else {
        is_typing = $("#content_typing").text();
    }
}

/**
 * Displays a modal dialog to select a pipeline for the current case and updates the corresponding buttons and layout.
 */
function case_pipeline_popup() {
    // Load the pipeline modal content into the case info modal
    let url = endpoints.case.pipeline.modal + case_param();
    $('#info_case_modal_content').load(url, function (response, status, xhr) {
        // If the modal content fails to load, display an error notification and return
        if (status !== "success") {
             ajax_notify_error(xhr, url);
             return false;
        }

        // Show the case info modal and initialize the pipeline selector
        $('#modal_case_detail').modal({ show: true });
        $("#update_pipeline_selector").selectpicker({
            liveSearch: true,
            style: "btn-outline-white"
        })
        $('#update_pipeline_selector').selectpicker("refresh");

        // Hide all pipeline argument controls and show the controls for the selected pipeline
        $(".control-update-pipeline-args ").hide();
        $('.control-update-pipeline-'+ $('#update_pipeline_selector').val() ).show();

        // Register a change event listener on the pipeline selector to show the corresponding pipeline argument controls
        $('#update_pipeline_selector').on('change', function(e){
            $(".control-update-pipeline-args ").hide();
            $('.control-update-pipeline-'+this.value).show();
        });

        // Initialize popovers for pipeline argument controls
        $('[data-toggle="popover"]').popover();
    });
}

/**
 * Displays the details of a case in a modal dialog.
 * 
 * @param {number} case_id - The ID of the case to display details for.
 * @param {boolean} edit_mode - Whether to display the case details in edit mode or not.
 */
function case_detail(case_id, edit_mode=false) {
    // Load the case details modal content into the case info modal
    let url = endpoints.case.details + case_id + case_param();
    $('#info_case_modal_content').load(url, function (response, status, xhr) {
        // If the modal content fails to load, display an error notification and return
        if (status !== "success") {
             ajax_notify_error(xhr, url);
             return false;
        }

        // Show the case info modal and enter edit mode if specified
        $('#modal_case_detail').modal({ show: true });
        if (edit_mode) {
            edit_case_info();
        }
    });
}

/**
 * Redirects the user to the case management page for the specified case.
 * 
 * @param {number} case_id - The ID of the case to manage.
 */
function manage_case(case_id) {
   window.location = endpoints.manage.cases.view + '?cid='+ case_id +'#view';
}


/**
 * Initializes the case summary editor with various options and key bindings.
 */
$(function() {
    // Set the editor theme based on the data-theme attribute of the editor_summary element
    if ($("#editor_summary").attr("data-theme") !== "dark") {
        editor.setTheme("ace/theme/tomorrow");
    } else {
        editor.setTheme("ace/theme/iris_night");
    }

    // Set the editor mode to markdown
    editor.session.setMode("ace/mode/markdown");

    // Set various editor options
    editor.renderer.setShowGutter(true);
    editor.setOption("showLineNumbers", true);
    editor.setOption("showPrintMargin", false);
    editor.setOption("displayIndentGuides", true);
    editor.setOption("indentedSoftWrap", false);
    editor.session.setUseWrapMode(true);
    editor.setOption("maxLines", "Infinity")
    editor.renderer.setScrollMargin(8, 5)
    editor.setOption("enableBasicAutocompletion", true);

    // Add key bindings for saving, bold, italic, and heading formatting
    editor.commands.addCommand({
        name: 'save',
        bindKey: {win: "Ctrl-S", "mac": "Cmd-S"},
        exec: function() {
            sync_editor(false);
        }
    })
    editor.commands.addCommand({
        name: 'bold',
        bindKey: {win: "Ctrl-B", "mac": "Cmd-B"},
        exec: function(editor) {
            editor.insertSnippet('**${1:$SELECTION}**');
        }
    });
    editor.commands.addCommand({
        name: 'italic',
        bindKey: {win: "Ctrl-I", "mac": "Cmd-I"},
        exec: function(editor) {
            editor.insertSnippet('*${1:$SELECTION}*');
        }
    });
    editor.commands.addCommand({
        name: 'head_1',
        bindKey: {win: "Ctrl-Shift-1", "mac": "Cmd-Shift-1"},
        exec: function(editor) {
            editor.insertSnippet('# ${1:$SELECTION}');
        }
    });
    editor.commands.addCommand({
        name: 'head_2',
        bindKey: {win: "Ctrl-Shift-2", "mac": "Cmd-Shift-2"},
        exec: function(editor) {
            editor.insertSnippet('## ${1:$SELECTION}');
        }
    });
    editor.commands.addCommand({
        name: 'head_3',
        bindKey: {win: "Ctrl-Shift-3", "mac": "Cmd-Shift-3"},
        exec: function(editor) {
            editor.insertSnippet('### ${1:$SELECTION}');
        }
    });
    editor.commands.addCommand({
        name: 'head_4',
        bindKey: {win: "Ctrl-Shift-4", "mac": "Cmd-Shift-4"},
        exec: function(editor) {
            editor.insertSnippet('#### ${1:$SELECTION}');
        }
    });

    // Add a paste event listener to handle pasting into the editor
    $('#editor_summary').on('paste', (event) => {
        event.preventDefault();
        handle_ed_paste(event);
    });

    // Add a keyup event listener to the editor to sync changes with the server
    var timer;
    var timeout = 10000;
    $('#editor_summary').keyup(function(){
        if(timer) {
             clearTimeout(timer);
        }
        timer = setTimeout(sync_editor, timeout);
    });

    // Add a change event listener to the editor to update the preview and mark changes as unsaved
    editor.getSession().on("change", function () {
        $('#last_saved').text('Changes not saved').addClass('badge-danger').removeClass('badge-success');
        let target = document.getElementById('targetDiv');
        let converter = get_showdown_convert();
        let html = converter.makeHtml(do_md_filter_xss(editor.getSession().getValue()));
        target.innerHTML = do_md_filter_xss(html);
    });

    // Call various functions to initialize the editor and page
    edit_case_summary();
    body_loaded();
    sync_editor(true);
    setInterval(auto_remove_typing, 2000);
    $('#modal_select_report').selectpicker();
    load_menu_mod_options_modal([], 'case', $("#case_modal_quick_actions"));

    // Register all events 
    setOnClickEventFromMap(summaryEventsMap, summaryClickEventNamespace);

});


