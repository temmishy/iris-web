import $ from 'jquery';
global.$ = global.jQuery = $;

import 'jquery-ui';
import showdown from 'showdown';
import Popover from 'bootstrap';
import { filterXSS } from 'xss';
import swal from 'sweetalert';
import html2canvas from 'html2canvas';
import ace from 'ace-builds';



/**
 * Namespace for common events.
 */
const commonEventNamespace = "commonEventNamespace";

/**
 * Namespace for common click events.
 */
const commonClickEventNamespace = `click.${commonEventNamespace}`;

/**
 * Map of common events and their corresponding functions.
 */
const commonEventsMap = {
    ".sidenav-case-activity-loader": function() {load_case_activity();}, 
    '.rotate': function() {$(this).toggleClass("down");},
    '.switch-context-loader': function() {load_context_switcher();}, 
    '.sidenav-dimtask-loader': function() {load_dim_limited_tasks();}
}

/**
 * Serializes a form into a JavaScript object.
 * 
 * @returns {Object} The serialized form as a JavaScript object.
 */
$.fn.serializeObject = function() {
  // Initialize an empty object to store the serialized form data.
  var o = {};
  
  // Serialize the form data into an array of objects.
  var a = this.serializeArray();
  
  // Iterate over each object in the serialized form data array.
  $.each(a, function() {
    // If the object's name property already exists in the object, add the value to an array.
    if (o[this.name]) {
      if (!o[this.name].push) {
        o[this.name] = [o[this.name]];
      }
      o[this.name].push(this.value || '');
    } 
    // Otherwise, add the name-value pair to the object.
    else {
      o[this.name] = this.value || '';
    }
  });
  
  // Return the serialized form data as a JavaScript object.
  return o;
};


/**
 * An array to store the menu options data.
 */
var jdata_menu_options = [];

let last_state = null;

/**
 * Hides any API error messages displayed on the page.
 */
export function clear_api_error() {
   $(".invalid-feedback").hide();
}

/**
 * Sets a cookie with the specified name, value, and expiration time.
 * 
 * @param {string} name - The name of the cookie.
 * @param {string} value - The value of the cookie.
 * @param {number} days - The number of days until the cookie expires.
 */
export function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

/**
 * Gets the value of a cookie with the specified name.
 * 
 * @param {string} name - The name of the cookie to retrieve.
 * @returns {string|null} The value of the cookie, or null if the cookie does not exist.
 */
export function getCookie(name) {
    // Construct the name-value equality string to search for in the cookie string.
    var nameEQ = name + "=";
    
    // Split the cookie string into an array of name-value pairs.
    var ca = document.cookie.split(';');
    
    // Iterate over each name-value pair in the cookie array.
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        
        // Remove any leading whitespace from the name-value pair.
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        
        // If the name-value pair matches the specified name, return the value.
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    
    // If the cookie does not exist, return null.
    return null;
}

/**
 * Deletes a cookie with the specified name.
 * 
 * @param {string} name - The name of the cookie to delete.
 */
export function eraseCookie(name) {
    // Set the cookie with the specified name to an empty value and an expiration date in the past.
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

/**
 * Attaches a click event listener to each element in a map of selectors and event handlers.
 * 
 * @param {Object} map - A map of selectors and event handlers.
 * @param {string} namespace - A namespace to use for the click event listener.
 */
export function setOnClickEventFromMap(map, namespace) {
    // Iterate over each element in the map.
    for (let element in map) {
        // Attach a click event listener to the element using the specified namespace.
        $(element).on(`click.${namespace}`, map[element]);
    }
}

/**
 * Removes a click event listener from each element in a map of selectors and event handlers.
 * 
 * @param {Object} map - A map of selectors and event handlers.
 * @param {string} namespace - The namespace used for the click event listener.
 */
export function unsetOnClickEventFromMap(map, namespace) {
    // Iterate over each element in the map.
    for (let element in map) {
        // Remove the click event listener from the element using the specified namespace.
        $(element).off(`click.${namespace}`);
    }
}

/**
 * Truncates a string to a specified length and adds an ellipsis if the string is longer than the specified length.
 * 
 * @param {string} data - The string to truncate.
 * @param {number} cutoff - The maximum length of the truncated string.
 * @param {boolean} wordbreak - Whether to break the string at the last whitespace character before the cutoff.
 * @returns {string} The truncated string with an ellipsis if necessary.
 */
export function ellipsis_field( data, cutoff, wordbreak ) {

    data = data.toString();

    if ( data.length <= cutoff ) {
        return filterXSS( data );
    }

    var shortened = data.substr(0, cutoff-1);

    // Find the last white space character in the string
    if ( wordbreak ) {
        shortened = shortened.replace(/\s([^\s]*)$/, '');
    }

    shortened = filterXSS( shortened );

    return '<div class="ellipsis" title="'+filterXSS(data)+'">'+shortened+'&#8230;</div>';
}

/**
 * Displays API error messages on the page.
 * 
 * @param {Object|string} data_error - The error message(s) to display.
 */
export function propagate_form_api_errors(data_error) {

    if (typeof (data_error) === typeof (' ')) {
        notify_error(data_error);
        return;
    }

    for (let e in data_error) {
        if($("#" + e).length !== 0) {
            $("#" + e).addClass('is-invalid');
            let errors = ""
            for (let n in data_error[e]) {
                    errors += data_error[e][n];
                }
            if($("#" + e + "-invalid-msg").length !== 0) {
                $("#" + e + "-invalid-msg").remove();
            }
            $("#" + e).after("<div class='invalid-feedback' id='" + e + "-invalid-msg'>" + errors +"</div>");
            $("#" + e + "-invalid-msg").show();
        }
        else {
            let msg = e + " - ";
            for (let n in data_error[e]) {
                    msg += data_error[e][n];
            }
            notify_error(msg);
        }
    }
}

/**
 * Displays an error message for an AJAX request.
 * 
 * @param {Object} jqXHR - The jQuery XMLHttpRequest object.
 * @param {string} url - The URL of the AJAX request.
 */
export function ajax_notify_error(jqXHR, url) {
    let message = '';
    if (jqXHR.status == 403) {
        message = 'Permission denied';
    } else {
        message = `We got error ${jqXHR.status} - ${jqXHR.statusText} requesting ${url}`;
    }
    notify_error(message);
}

/**
 * Displays an error message on the page.
 * 
 * @param {string|Array} message - The error message(s) to display.
 */
export function notify_error(message) {
    // If the message is an array, concatenate its elements into a single string.
    let data = "";
    if (typeof (message) == typeof ([])) {
        for (let element in message) {
            data += element
        }
    } else {
        data = message;
    }
    
    // Sanitize the error message and wrap it in a <p> tag.
    data = '<p>' + sanitizeHTML(data) + '</p>';
    
    // Display the error message using the Bootstrap Notify plugin.
    $.notify({
        icon: 'fas fa-triangle-exclamation',
        message: data,
        title: 'Error'
    }, {
        type: 'danger',
        placement: {
            from: 'bottom',
            align: 'left'
        },
        z_index: 2000,
        timer: 8000,
        animate: {
            enter: 'animated fadeIn',
            exit: 'animated fadeOut'
        }
    });
}

/**
 * Displays a success message on the page.
 * 
 * @param {string} message - The success message to display.
 */
export function notify_success(message) {
    // Sanitize the success message and wrap it in a <p> tag.
    message = '<p>' + sanitizeHTML(message) + '</p>';
    
    // Display the success message using the Bootstrap Notify plugin.
    $.notify({
        icon: 'fas fa-check',
        message: message
    }, {
        type: 'success',
        placement: {
            from: 'bottom',
            align: 'left'
        },
        z_index: 2000,
        timer: 2500,
        animate: {
            enter: 'animated fadeIn',
            exit: 'animated fadeOut'
        }
    });
}

/**
 * Displays a warning message on the page.
 * 
 * @param {string} message - The warning message to display.
 */
export function notify_warning(message) {
    // Sanitize the warning message and wrap it in a <p> tag.
    message = '<p>' + sanitizeHTML(message) + '</p>';
    
    // Display the warning message using the Bootstrap Notify plugin.
    $.notify({
        icon: 'fas fa-exclamation',
        message: message
    }, {
        type: 'warning',
        placement: {
            from: 'bottom',
            align: 'left'
        },
        z_index: 2000,
        timer: 2500,
        animate: {
            enter: 'animated fadeIn',
            exit: 'animated fadeOut'
        }
    });
}

/**
 * Sends an AJAX request to the server and displays a success or error message based on the response.
 * 
 * @param {Object} data - The data to send in the AJAX request.
 * @param {boolean} silent_success - Whether to display a success message.
 * @returns {boolean} Whether the operation succeeded.
 */
export function notify_auto_api(data, silent_success) {
    if (data.status === 'success') {
        if (silent_success === undefined || silent_success === false) {
            if (data.message.length === 0) {
                data.message = 'Operation succeeded';
            }
            notify_success(data.message);
        }
        return true;
    } else {
        if (data.message.length === 0) {
            data.message = 'Operation failed';
        }
        notify_error(data.message);
        return false;
    }
}

/**
 * Sends a GET AJAX request to the server and handles API errors.
 * 
 * @param {string} uri - The URI to send the GET request to.
 * @param {boolean} propagate_api_error - Whether to propagate API errors.
 * @param {Function} beforeSend_fn - A function to execute before sending the AJAX request.
 * @param {string} cid - A case ID to include in the request.
 * @returns {Object} The response from the server.
 */
export function get_request_api(uri, propagate_api_error, beforeSend_fn, cid) {
    // If a case ID is not provided, generate one.
    if (cid === undefined ) {
        cid = case_param();
    } else {
        cid = '?cid=' + cid;
    }

    // Append the case ID to the URI.
    uri = uri + cid;
    
    // Send the GET request and handle API errors.
    return get_raw_request_api(uri, propagate_api_error, beforeSend_fn)
}

/**
 * Sends a GET AJAX request to the server and returns the response.
 * 
 * @param {string} uri - The URI to send the GET request to.
 * @param {boolean} propagate_api_error - Whether to propagate API errors.
 * @param {Function} beforeSend_fn - A function to execute before sending the AJAX request.
 * @returns {Object} The response from the server.
 */
export function get_raw_request_api(uri, propagate_api_error, beforeSend_fn) {
    return $.ajax({
        url: uri,
        type: 'GET',
        dataType: "json",
        beforeSend: function(jqXHR, settings) {
            if (beforeSend_fn !== undefined && beforeSend_fn !== null) {
                beforeSend_fn(jqXHR, settings);
            }
        },
        error: function(jqXHR) {
            if (propagate_api_error) {
                if(jqXHR.responseJSON && jqXHR.status == 400) {
                    propagate_form_api_errors(jqXHR.responseJSON.data);
                } else {
                    ajax_notify_error(jqXHR, this.url);
                }
            } else {
                if(jqXHR.responseJSON) {
                    notify_error(jqXHR.responseJSON.message);
                } else {
                    ajax_notify_error(jqXHR, this.url);
                }
            }
        }
    });
}

/**
 * Sets a warning message on the page.
 * 
 * @param {string} msg - The warning message to display.
 */
export function set_page_warning(msg) {
    $('#page_warning').text(msg);
}

/**
 * Sends a GET AJAX request to the server with data and returns the response.
 * 
 * @param {string} uri - The URI to send the GET request to.
 * @param {Object} data - The data to send in the GET request.
 * @param {boolean} propagate_api_error - Whether to propagate API errors.
 * @param {Function} beforeSend_fn - A function to execute before sending the AJAX request.
 * @returns {Object} The response from the server.
 */
export function get_request_data_api(uri, data, propagate_api_error, beforeSend_fn) {
    return $.ajax({
        url: uri + case_param(),
        type: 'GET',
        data: data,
        dataType: "json",
        beforeSend: function(jqXHR, settings) {
            if (beforeSend_fn !== undefined) {
                beforeSend_fn(jqXHR, settings);
            }
        },
        error: function(jqXHR) {
            if (propagate_api_error) {
                if(jqXHR.responseJSON && jqXHR.status == 400) {
                    propagate_form_api_errors(jqXHR.responseJSON.data);
                } else {
                    ajax_notify_error(jqXHR, this.url);
                }
            } else {
                if(jqXHR.responseJSON) {
                    notify_error(jqXHR.responseJSON.message);
                } else {
                    ajax_notify_error(jqXHR, this.url);
                }
            }
        }
    });
}

/**
 * Sends a POST AJAX request to the server with data and returns the response.
 * 
 * @param {string} uri - The URI to send the POST request to.
 * @param {Object} data - The data to send in the POST request.
 * @param {boolean} propagate_api_error - Whether to propagate API errors.
 * @param {Function} beforeSend_fn - A function to execute before sending the AJAX request.
 * @param {string} cid - A case ID to include in the request.
 * @returns {Object} The response from the server.
 */
export function post_request_api(uri, data, propagate_api_error, beforeSend_fn, cid) {
   // If a case ID is not provided, generate one.
   if (cid === undefined ) {
     cid = case_param();
   } else {
     cid = '?cid=' + cid;
   }

   // If data is not provided, include the CSRF token.
   if (data === undefined || data === null) {
        data = JSON.stringify({
            'csrf_token': $('#csrf_token').val()
        });
   }

   // Send the POST request and handle API errors.
   return $.ajax({
        url: uri + cid,
        type: 'POST',
        data: data,
        dataType: "json",
        contentType: "application/json;charset=UTF-8",
        beforeSend: function(jqXHR, settings) {
            if (typeof beforeSend_fn === 'function') {
                beforeSend_fn(jqXHR, settings);
            }
        },
        error: function(jqXHR) {
            if (propagate_api_error) {
                if(jqXHR.responseJSON && jqXHR.status == 400) {
                    propagate_form_api_errors(jqXHR.responseJSON.data);
                } else {
                    ajax_notify_error(jqXHR, this.url);
                }
            } else {
                if(jqXHR.responseJSON) {
                    notify_error(jqXHR.responseJSON.message);
                } else {
                    ajax_notify_error(jqXHR, this.url);
                }
            }
        }
    });
}

/**
 * Sends a POST AJAX request to the server with data and returns the response.
 * 
 * @param {string} uri - The URI to send the POST request to.
 * @param {Object} data - The data to send in the POST request.
 * @param {boolean} propagate_api_error - Whether to propagate API errors.
 * @param {Function} beforeSend_fn - A function to execute before sending the AJAX request.
 * @returns {Object} The response from the server.
 */
export function post_request_data_api(uri, data, propagate_api_error, beforeSend_fn) {
   // Send the POST request and handle API errors.
   return $.ajax({
        url: uri + case_param(),
        type: 'POST',
        data: data,
        dataType: "json",
        contentType: false,
        processData: false,
        beforeSend: function(jqXHR, settings) {
            if (beforeSend_fn !== undefined) {
                beforeSend_fn(jqXHR, settings);
            }
        },
        error: function(jqXHR) {
            if (propagate_api_error) {
                if(jqXHR.responseJSON && jqXHR.status == 400) {
                    propagate_form_api_errors(jqXHR.responseJSON.data);
                } else {
                    ajax_notify_error(jqXHR, this.url);
                }
            } else {
                if(jqXHR.responseJSON) {
                    notify_error(jqXHR.responseJSON.message);
                } else {
                    ajax_notify_error(jqXHR, this.url);
                }
            }
        }
    });
}

/**
 * Updates a URL parameter with a new value and returns the modified URL.
 * 
 * @param {string} url - The URL to modify.
 * @param {string} param - The name of the parameter to update.
 * @param {string} paramVal - The new value for the parameter.
 * @returns {string} The modified URL.
 */
export function updateURLParameter(url, param, paramVal) {
    var TheAnchor = null;
    var newAdditionalURL = "";
    var tempArray = url.split("?");
    var baseURL = tempArray[0];
    var additionalURL = tempArray[1];
    var temp = "";
    var tmpAnchor = null;
    var TheParams = null;

    if (additionalURL)
    {
        tmpAnchor = additionalURL.split("#");
        TheParams = tmpAnchor[0];
        TheAnchor = tmpAnchor[1];
        if(TheAnchor)
            additionalURL = TheParams;

        tempArray = additionalURL.split("&");

        // Iterate over each parameter in the URL.
        for (var i=0; i<tempArray.length; i++)
        {
            // If the parameter is not the one to update, add it to the new URL.
            if(tempArray[i].split('=')[0] != param)
            {
                newAdditionalURL += temp + tempArray[i];
                temp = "&";
            }
        }
    }
    else
    {
        tmpAnchor = baseURL.split("#");
        TheParams = tmpAnchor[0];
        TheAnchor  = tmpAnchor[1];

        if(TheParams)
            baseURL = TheParams;
    }

    // If the URL has an anchor, append it to the new parameter value.
    if(TheAnchor)
        paramVal += "#" + TheAnchor;

    // Construct the new parameter string.
    var rows_txt = temp + "" + param + "=" + paramVal;

    // Return the modified URL.
    return baseURL + "?" + newAdditionalURL + rows_txt;
}

/**
 * Gets the value of the "cid" parameter from the URL.
 * 
 * @returns {string|null} The value of the "cid" parameter, or null if it does not exist.
 */
export function get_caseid() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    // Return the value of the "cid" parameter.
    return urlParams.get('cid')
}

/**
 * Checks if the current URL has a "redirect" parameter.
 * 
 * @returns {boolean} Whether the URL has a "redirect" parameter.
 */
export function is_redirect() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    return urlParams.get('redirect')
}

/**
 * Displays a notification if the current URL has a "redirect" parameter, and removes the parameter from the URL.
 */
export function notify_redirect() {
    // If the URL has a "redirect" parameter, display a notification and remove the parameter from the URL.
    if (is_redirect()) {
        swal("You've been redirected",
             "The case you attempted to reach wasn't found.\nYou have been redirected to a default case.",
             "info", {button: "OK"}
             ).then(() => {
                    let queryString = window.location.search;
                    let urlParams = new URLSearchParams(queryString);
                    urlParams.delete('redirect');
                    history.replaceState(null, null, window.location.pathname + '?' + urlParams.toString());
                });
    }
}

/**
 * Constructs a URL parameter string with the "cid" parameter set to the value returned by the get_caseid function.
 * 
 * @returns {string} The URL parameter string.
 */
export function case_param() {
    var params = {
        cid: get_caseid
    }
    return '?'+ $.param(params);
}

/**
 * Tracks whether the last refresh of the page needs to be checked.
 */
var need_check = true;

/**
 * Updates the last refresh time on the page and removes the warning class.
 */
export function update_last_resfresh() {
    need_check = true;
    $('#last_resfresh').text("").removeClass("text-warning");
}

/**
 * Checks for updates on the server and displays a warning if updates are available.
 * 
 * @param {string} url - The URL to check for updates.
 */
export function check_update(url) {
    // If the last refresh needs to be checked, send an AJAX request to the server to check for updates.
    if (need_check) {
        $.ajax({
            url: url + case_param(),
            type: "GET",
            dataType: "json",
            success: function (data) {
                // If the last state is null or less than the current object state, display a warning.
                if (last_state == null || last_state < data.data.object_state) {
                    $('#last_resfresh').text("Updates available").addClass("text-warning");
                    need_check = false;
                }
            },
            error: function (data) {
                // If the status is 404, display an error message and prompt the user to go to their default case.
                if (data.status == 404) {
                    swal("Stop everything !",
                    "The case you are working on was deleted",
                    "error",
                    {
                        buttons: {
                            again: {
                                text: "Go to my default case",
                                value: "default"
                            }
                        }
                    }
                    ).then((value) => {
                        switch (value) {
                            case "dash":
                                location.reload();
                                break;

                            default:
                                location.reload();
                        }
                    });
                } 
                // If the status is 403, redirect the user to the case page.
                else if (data.status == 403) {
                    window.location.replace("/case" + case_param());
                } 
                // If the status is 400, log a standard error message.
                else if (data.status == 400) {
                    console.log('Bad request logged - standard error message');
                } 
                // If the status is anything else, display a connection error message.
                else {
                    notify_error('Connection with server lost');
                }
            }
        });
    }
}

/**
 * Sets the last state to the object state of the given state object and updates the last refresh time on the page.
 * 
 * @param {Object} state - The state object to set the last state to.
 */
export function set_last_state(state){
    if (state != null) {
        last_state = state.object_state;
    }
    update_last_resfresh();
}

/**
 * Displays a loading message on the page.
 */
export function show_loader() {
    $('#loading_msg').show();
    $('#card_main_load').hide();
}

/**
 * Hides the loading message and shows the main card.
 */
export function hide_loader() {
    $('#loading_msg').hide();
    $('#card_main_load').show();
    update_last_resfresh();
}

/**
 * Converts a list of words to a string of badges.
 * 
 * @param {Array} wordlist - The list of words to convert.
 * @param {string} style - The style of the badges.
 * @param {number} limit - The maximum number of badges to display before showing a count.
 * @param {string} type - The type of the badges.
 * @returns {string} The string of badges.
 */
export function list_to_badges(wordlist, style, limit, type) {
    let badges = "";
    // If the wordlist is longer than the limit, display a count badge.
    if (wordlist.length > limit) {
       badges = `<span class="badge badge-${style} ml-2">${wordlist.length} ${type}</span>`;
    }
    // Otherwise, display a badge for each word in the list.
    else {
        wordlist.forEach(function (item) {
            badges += `<span class="badge badge-${style} ml-2">${sanitizeHTML(item)}</span>`;
        });
    }

    return badges;
}

/**
 * Sanitizes an HTML string to prevent XSS attacks.
 * 
 * @param {string} str - The HTML string to sanitize.
 * @param {Object} options - The options to use for sanitization.
 * @returns {string} The sanitized HTML string.
 */
export var sanitizeHTML = function (str, options) {
    if (options) {
        return filterXSS(str, options);
    } else {
        return filterXSS(str);
    }
};

/**
 * Checks if a string consists only of whitespace characters.
 * 
 * @param {string} s - The string to check.
 * @returns {boolean} Whether the string consists only of whitespace characters.
 */
export function isWhiteSpace(s) {
  return /^\s+$/.test(s);
}

/**
 * Exports a PNG image of the inner content of the page.
 */
export function exportInnerPng() {
    // Close the quick sidebar.
    let close_sid_var = document.querySelector(".close-quick-sidebar");
    close_sid_var.click();
    
    // Select the page inner content and export it as a PNG image using html2canvas.
    let div = document.querySelector(".page-inner");
    html2canvas(div, {
        useCORS: true,
        scale: 3,
        backgroundColor: "#f9fbfd"
        }).then(canvas => {
        // Download the PNG image with a filename based on the current page URL.
        downloadURI(canvas.toDataURL(), 'iris'+location.pathname.replace('/', '_') + '.png')
    });
}

/**
 * Downloads a URI as a file with the given name.
 * 
 * @param {string} uri - The URI to download.
 * @param {string} name - The name to give the downloaded file.
 */
export function downloadURI(uri, name) {
    var link = document.createElement("a");

    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    link.remove();
}

/**
 * Builds a share link for the given lookup ID.
 * 
 * @param {string} lookup_id - The lookup ID to include in the share link.
 * @returns {string} The share link.
 */
export function buildShareLink(lookup_id) {
    let current_path = location.protocol + '//' + location.host + location.pathname;
    current_path = current_path + case_param() + '&shared=' + lookup_id;

    return current_path;
}

/**
 * Copies the share link for the given node ID to the clipboard and displays a success or error message.
 * 
 * @param {string} node_id - The node ID to include in the share link.
 */
export function copy_object_link(node_id) {
    let link = buildShareLink(node_id);
    navigator.clipboard.writeText(link).then(function() {
          notify_success('Shared link copied');
    }, function(err) {
        notify_error('Can\'t copy link. I printed it in console.');
        console.error('Shared link', err);
    });
}

/**
 * Capitalizes the first letter of the given string.
 * 
 * @param {string} string - The string to capitalize.
 * @returns {string} The capitalized string.
 */
export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Copies the markdown link for the given data type and node ID to the clipboard and displays a success or error message.
 * 
 * @param {string} data_type - The type of data to include in the markdown link.
 * @param {string} node_id - The node ID to include in the markdown link.
 */
export function copy_object_link_md(data_type, node_id){
    let link = `[<i class="fa-solid fa-tag"></i> ${capitalizeFirstLetter(data_type)} #${node_id}](${buildShareLink(node_id)})`
    navigator.clipboard.writeText(link).then(function() {
        notify_success('MD link copied');
    }, function(err) {
        notify_error('Can\'t copy link. I printed it in console.');
        console.error('Shared link', err);
    });
}

/**
 * Loads the case activity list from the server and displays it on the page.
 */
function load_case_activity(){
    get_request_api('/case/activities/list')
    .done((data) => {
        let js_data = data.data;
        let api_flag = '';
        let title = '';

        $('#case_activities').empty();
        for (let index in js_data) {

            if (js_data[index].is_from_api) {
                api_flag = 'feed-item-primary';
                title = 'Activity issued from API';
            } else {
                api_flag = 'feed-item-default';
                title = 'Activity issued from GUI';
            }

            let entry =	`<li class="feed-item ${api_flag}" title='${sanitizeHTML(title)}'>
                    <time class="date" datetime="${js_data[index].activity_date}">${js_data[index].activity_date}</time>
                    <span class="text">${sanitizeHTML(js_data[index].name)} - ${sanitizeHTML(js_data[index].activity_desc)}</span>
                    </li>`
            $('#case_activities').append(entry);
        }
    });
}

/**
 * Loads the first 100 DIM tasks from the server and displays them on the page.
 */
function load_dim_limited_tasks(){
    get_request_api('/dim/tasks/list/100')
    .done((data) => {
        let js_data = data.data;
        let api_flag = '';
        let title = '';

        $('#dim_tasks_feed').empty();
        for (let index in js_data) {

            if (js_data[index].state == 'success') {
                api_flag = 'feed-item-success';
                title = 'Task succeeded';
            } else {
                api_flag = 'feed-item-warning';
                title = 'Task pending or failed';
            }

            let entry =	`<li class="feed-item ${api_flag}" title='${title}'>
                    <time class="date" datetime="${js_data[index].activity_date}">${js_data[index].date_done}</time>
                    <span class="text" title="${js_data[index].task_id}"><a href="#" onclick='dim_task_status("${js_data[index].task_id}");return false;'>${js_data[index].module}</a> - ${js_data[index].user}</span>
                    </li>`
            $('#dim_tasks_feed').append(entry);
        }
    });
}

/**
 * Displays the status of the DIM task with the given ID in a modal.
 * 
 * @param {string} id - The ID of the DIM task to display the status of.
 */
export function dim_task_status(id) {
    const url = '/dim/tasks/status/'+id + case_param();
    $('#info_dim_task_modal_body').load(url, function (response, status, xhr) {
        if (status !== "success") {
             ajax_notify_error(xhr, url);
             return false;
        }
        $('#modal_dim_task_detail').modal({show:true});
    });
}

/**
 * Initializes the processing of a module with the given rows, data type, and output hook name.
 * 
 * @param {Array} rows - The rows to process.
 * @param {string} data_type - The type of data to process.
 * @param {string} out_hook_name - The name of the output hook to use.
 * @returns {boolean} Whether the initialization was successful.
 */
export function init_module_processing_wrap(rows, data_type, out_hook_name) {
    console.log(out_hook_name);
    let hook_name = null;
    let hook_ui_name = null;
    let module_name = null;

    for (let opt in jdata_menu_options) {
        console.log(jdata_menu_options[opt]);
        if (jdata_menu_options[opt].manual_hook_ui_name == out_hook_name) {
            hook_name = jdata_menu_options[opt].hook_name;
            hook_ui_name = jdata_menu_options[opt].manual_hook_ui_name;
            module_name = jdata_menu_options[opt].module_name;
            break
        }
    }
    if (hook_name == null) {
        notify_error('Error: hook not found');
        return false;
    }
    return init_module_processing(rows, hook_name, hook_ui_name, module_name, data_type);
}

/**
 * Initializes the processing of a module with the given rows, hook name, hook UI name, module name, and data type.
 * 
 * @param {Array} rows - The rows to process.
 * @param {string} hook_name - The name of the hook to use.
 * @param {string} hook_ui_name - The UI name of the hook to use.
 * @param {string} module_name - The name of the module to use.
 * @param {string} data_type - The type of data to process.
 */
export function init_module_processing(rows, hook_name, hook_ui_name, module_name, data_type) {
    var data = Object();
    data['hook_name'] = hook_name;
    data['module_name'] = module_name;
    data['hook_ui_name'] = hook_ui_name;
    data['csrf_token'] = $('#csrf_token').val();
    data['type'] = data_type;
    data['targets'] = [];

    let type_map = {
        "ioc": "ioc_id",
        "asset": "asset_id",
        "task": "task_id",
        "global_task": "task_id",
        "evidence": "id"
    }

    for (let index in rows) {
        if (typeof rows[index] === 'object') {
            data['targets'].push(rows[index][type_map[data_type]]);
        } else {
            data['targets'].push(rows[index]);
        }
    }

    post_request_api("/dim/hooks/call", JSON.stringify(data), true)
    .done(function (data){
        notify_auto_api(data)
    });
}

/**
 * Loads the module options for the given data type and displays them in a dropdown menu.
 * 
 * @param {string} element_id - The ID of the element to process.
 * @param {string} data_type - The type of data to process.
 * @param {Object} anchor - The anchor object to append the dropdown menu to.
 */
export function load_menu_mod_options_modal(element_id, data_type, anchor) {
    get_request_api('/dim/hooks/options/'+ data_type +'/list')
    .done(function (data){
        if(notify_auto_api(data, true)) {
            if (data.data != null) {
                let jsdata = data.data;
                if (jsdata.length != 0) {
                    anchor.append('<div class="dropdown-divider"></div>');
                }
                let opt = null;
                let menu_opt = null;

                for (let option in jsdata) {
                    opt = jsdata[option];
                    menu_opt = `<a class="dropdown-item" href="#" onclick='init_module_processing(["${element_id}"], "${opt.hook_name}",`+
                                `"${opt.manual_hook_ui_name}","${opt.module_name}","${data_type}");return false;'><i class="fa fa-arrow-alt-circle-right mr-2"></i> ${opt.manual_hook_ui_name}</a>`
                    anchor.append(menu_opt);
                }

            }
        }
    })
}

/**
 * Gets the ID of the given row.
 * 
 * @param {Object} row - The row to get the ID of.
 * @returns {string|null} The ID of the row, or null if no ID is found.
 */
export function get_row_id(row) {
    const ids_map = ["ioc_id","asset_id","task_id","id"];
    for (let id in ids_map) {
        if (row[ids_map[id]] !== undefined) {
            return row[ids_map[id]];
        }
    }
    return null;
}

var iClassWhiteList = ['fa-solid fa-tags','fa-solid fa-tag', 'fa-solid fa-bell', 'fa-solid fa-virus-covid text-danger mr-1',
'fa-solid fa-file-shield text-success mr-1', 'fa-regular fa-file mr-1', 'fa-solid fa-lock text-success mr-1']

/**
 * Creates a new Ace editor with the given parameters.
 * 
 * @param {string} anchor_id - The ID of the anchor element to attach the editor to.
 * @param {string} content_anchor - The ID of the anchor element to attach the content to.
 * @param {string} target_anchor - The ID of the anchor element to attach the target to.
 * @param {function} onchange_callback - The callback function to execute when the editor content changes.
 * @param {function} do_save - The function to execute when the user saves the editor content.
 * @param {boolean} readonly - Whether or not the editor should be read-only.
 * @param {boolean} live_preview - Whether or not to enable live preview of the editor content.
 * @returns {Object} The Ace editor object.
 */
export function get_new_ace_editor(anchor_id, content_anchor, target_anchor, onchange_callback, do_save, readonly, live_preview) {
    var editor = ace.edit(anchor_id);
    if ($("#"+anchor_id).attr("data-theme") != "dark") {
        editor.setTheme("ace/theme/tomorrow");
    } else {
        editor.setTheme("ace/theme/iris_night");
    }
    editor.session.setMode("ace/mode/markdown");
    if (readonly !== undefined) {
        editor.setReadOnly(readonly);
    }
    editor.renderer.setShowGutter(true);
    editor.setOption("showLineNumbers", true);
    editor.setOption("showPrintMargin", false);
    editor.setOption("displayIndentGuides", true);
    editor.setOption("maxLines", "Infinity");
    editor.setOption("minLines", "2");
    editor.setOption("autoScrollEditorIntoView", true);
    editor.session.setUseWrapMode(true);
    editor.setOption("indentedSoftWrap", false);
    editor.renderer.setScrollMargin(8, 5)
    editor.setOption("enableBasicAutocompletion", true);

    if (do_save !== undefined && do_save !== null) {
        editor.commands.addCommand({
            name: 'save',
            bindKey: {win: "Ctrl-S", "mac": "Cmd-S"},
            exec: function() {
                do_save()
            }
        });
    }

    // Add commands for bold, italic, and headers
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

    // Enable live preview if specified
    if (live_preview === undefined || live_preview === true) {
        let textarea = $('#'+content_anchor);
        editor.getSession().on("change", function () {
            if (onchange_callback !== undefined && onchange_callback !== null) {
                onchange_callback();
            }

            textarea.text(editor.getSession().getValue());
            let target = document.getElementById(target_anchor);
            let converter = get_showdown_convert();
            let html = converter.makeHtml(editor.getSession().getValue());
            target.innerHTML = do_md_filter_xss(html);

        });

        textarea.text(editor.getSession().getValue());
        let target = document.getElementById(target_anchor);
        let converter = get_showdown_convert();
        let html = converter.makeHtml(editor.getSession().getValue());
        target.innerHTML = do_md_filter_xss(html);

    }

    return editor;
}

/**
 * Creates a new extension for sanitizing img tags in Markdown.
 * 
 * @returns {Array} The extension object.
 */
export function createSanitizeExtensionForImg() {
  return [
    {
      type: 'lang',
      regex: /<.*?>/g,
      replace: function (match) {
        if (match.startsWith('<img')) {
          return match.replace(/on\w+="[^"]*"/gi, '');
        }
        return '';
      },
    },
  ];
}

/**
 * Returns a new instance of the Showdown converter with specified options and extensions.
 * 
 * @returns {Object} The Showdown converter object.
 */
export function get_showdown_convert() {
    return new showdown.Converter({
        tables: true,
        parseImgDimensions: true,
        emoji: true,
        smoothLivePreview: true,
        strikethrough: true,
        tasklists: true,
        extensions: ['bootstrap-tables', createSanitizeExtensionForImg()]
    });
}

/**
 * Sanitizes the given HTML string to prevent XSS attacks.
 * 
 * @param {string} html - The HTML string to sanitize.
 * @returns {string} The sanitized HTML string.
 */
export function do_md_filter_xss(html) {
    return filterXSS(html, {
        stripIgnoreTag: false,
        whiteList: {
                i: ['class', "title"],
                a: ['href', 'title', 'target'],
                img: ['src', 'alt', 'title', 'width', 'height'],
                div: ['class'],
                p: [],
                hr: [],
                h1: [], h2: [], h3: [], h4: [], h5: [], h6: [],
                ul: [], ol: [], li: [],
                code: [], pre: [], em: [], strong: [],
                blockquote: [], del: [],
                input: ['type', 'checked', 'disabled', 'class'],
                table: ['class'], thead: [], tbody: [], tr: [], th: [], td: []
            },
        onTagAttr: function (tag, name, value) {
            if (tag === "i" && name === "class") {
                // Check if the class is in the whitelist
                if (iClassWhiteList.indexOf(value) === -1) {
                    return false; // Remove the attribute if not in the whitelist
                } else {
                    return name + '="' + value + '"'; // Return the attribute if in the whitelist
                }
            }
          }
        });
}

/**
 * Returns the initials of a name to be used as an avatar.
 * 
 * @param {string} name - The name to get the initials from.
 * @param {boolean} small - Whether or not to use a small avatar.
 * @param {function} onClickFunction - The function to execute when the avatar is clicked.
 * @returns {string} The HTML string for the avatar.
 */
const avatarCache = {};

export function get_avatar_initials(name, small, onClickFunction) {
    const av_size = small ? 'avatar-sm' : 'avatar';
    const onClick = onClickFunction ? `onclick="${onClickFunction}"` : '';

    if (avatarCache[name] && avatarCache[name][small ? 'small' : 'large']) {
        return `<div class="avatar ${av_size}" title="${name}" ${onClick}>
            ${avatarCache[name][small ? 'small' : 'large']}
        </div>`;
    }

    const initial = name.split(' ');
    let snum;

    if (initial.length > 1) {
        snum = initial[0][0].charCodeAt(0) + initial[1][0].charCodeAt(0);
    } else {
        snum = initial[0][0].charCodeAt(0);
    }

    const initials = initial.map(i => i[0].toUpperCase()).join('');
    const avatarColor = get_avatar_color(snum);

    const avatarHTMLin = `<span class="avatar-title avatar-iris rounded-circle" style="background-color:${avatarColor}; cursor:pointer;">${initials}</span>`
    const avatarHTMLout = `<div class="avatar ${av_size}" title="${name}" ${onClick}>
        ${avatarHTMLin}
    </div>`;

    if (!avatarCache[name]) {
        avatarCache[name] = {};
    }
    avatarCache[name][small ? 'small' : 'large'] = avatarHTMLin;

    return avatarHTMLout;
}

/**
 * Returns an HSL color string based on the given number.
 * 
 * @param {number} snum - The number to use for generating the color.
 * @returns {string} The HSL color string.
 */
export function get_avatar_color(snum) {
    const hue = snum * 137.508 % 360; // Use the golden angle for more distinct colors
    const saturation = 40 + (snum % 20); // Saturation range: 40-60
    const lightness = 55 + (snum % 10); // Lightness range: 70-80

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Toggles the visibility of an inner editor and adjusts the container and button accordingly.
 * 
 * @param {string} btn_id - The ID of the button to toggle.
 * @param {string} container_id - The ID of the container to toggle.
 * @param {string} ctrd_id - The ID of the container to adjust.
 * @returns {boolean} False to prevent default behavior.
 */
export function edit_inner_editor(btn_id, container_id, ctrd_id) {
    $('#'+container_id).toggle();
    if ($('#'+container_id).is(':visible')) {
        $('#'+btn_id).show(100);
        $('#'+ctrd_id).removeClass('col-md-12').addClass('col-md-6');
    } else {
        $('#'+btn_id).hide(100);
        $('#'+ctrd_id).removeClass('col-md-6').addClass('col-md-12');
    }
    return false;
}

/**
 * Returns the HTML string for the editor headers.
 * 
 * @param {string} editor_instance - The ID of the editor instance.
 * @param {string} save - The function to execute when the save button is clicked.
 * @returns {string} The HTML string for the editor headers.
 */
export function get_editor_headers(editor_instance, save) {
    // Create the save button HTML string if the save function is provided
    var save_html = `<div class="btn btn-sm btn-light mr-1 " title="CTRL-S" id="last_saved" onclick="${save}( this );"><i class="fa-solid fa-file-circle-check"></i></div>`;
    if (save === undefined || save === null) {
        save_html = '';
    }

    // Create the header HTML string with various buttons for formatting
    let header = `
                ${save_html}
                <div class="btn btn-sm btn-light mr-1 " title="CTRL-B" onclick="${editor_instance}.insertSnippet`+"('**${1:$SELECTION}**');"+`${editor_instance}.focus();"><i class="fa-solid fa-bold"></i></div>
                <div class="btn btn-sm btn-light mr-1" title="CTRL-I" onclick="${editor_instance}.insertSnippet`+"('*${1:$SELECTION}*');"+`${editor_instance}.focus();"><i class="fa-solid fa-italic"></i></div>
                <div class="btn btn-sm btn-light mr-1" title="CTRL-SHIFT-1" onclick="${editor_instance}.insertSnippet`+"('# ${1:$SELECTION}');"+`${editor_instance}.focus();">H1</div>
                <div class="btn btn-sm btn-light mr-1" title="CTRL-SHIFT-2" onclick="${editor_instance}.insertSnippet`+"('## ${1:$SELECTION}')"+`;${editor_instance}.focus();">H2</div>
                <div class="btn btn-sm btn-light mr-1" title="CTRL-SHIFT-3" onclick="${editor_instance}.insertSnippet`+"('### ${1:$SELECTION}');"+`${editor_instance}.focus();">H3</div>
                <div class="btn btn-sm btn-light mr-1" title="CTRL-SHIFT-4" onclick="${editor_instance}.insertSnippet`+"('#### ${1:$SELECTION}');"+`${editor_instance}.focus();">H4</div>
                <div class="btn btn-sm btn-light mr-1" title="Insert code" onclick="${editor_instance}.insertSnippet`+"('```${1:$SELECTION}```');"+`${editor_instance}.focus();"><i class="fa-solid fa-code"></i></div>
                <div class="btn btn-sm btn-light mr-1" title="Insert link" onclick="${editor_instance}.insertSnippet`+"('[New link](${1:$SELECTION})');"+`${editor_instance}.focus();"><i class="fa-solid fa-link"></i></div>
                <div class="btn btn-sm btn-light mr-1" title="Insert table" onclick="${editor_instance}.insertSnippet`+"('|\\t|\\t|\\t|\\n|--|--|--|\\n|\\t|\\t|\\t|\\n|\\t|\\t|\\t|');"+`${editor_instance}.focus();"><i class="fa-solid fa-table"></i></div>
                <div class="btn btn-sm btn-light mr-1" title="Insert bullet list" onclick="${editor_instance}.insertSnippet`+"('\\n- \\n- \\n- ');"+`${editor_instance}.focus();"><i class="fa-solid fa-list"></i></div>
                <div class="btn btn-sm btn-light mr-1" title="Insert numbered list" onclick="${editor_instance}.insertSnippet`+"('\\n1. a  \\n2. b  \\n3. c  ');"+`${editor_instance}.focus();"><i class="fa-solid fa-list-ol"></i></div>
    `
    return header;
}

/**
 * Redirects the user to the case number entered in the input field.
 */
export function goto_case_number() {
    // Get the case number from the input field
    const case_id = $('#goto_case_number_input').val();

    // Check if the case number is valid
    if (case_id !== '' && isNaN(case_id) === false) {
        // Send a request to check if the case exists
        get_request_api('/case/exists', true, null, case_id)
        .done(function (data){
            // If the case exists, redirect to the case page
            if(notify_auto_api(data, true)) {
                var url = new window.URL(document.location);
                url.searchParams.set("cid", case_id);
                window.location.href = url.href;
            }
        });
    }
}

/**
 * Loads the menu options for the given data type and table.
 * 
 * @param {string} data_type - The type of data to load menu options for.
 * @param {Object} table - The table object to load menu options for.
 * @param {function} deletion_fn - The function to execute when the delete button is clicked.
 */
let comment_element = function(){};

export function load_menu_mod_options(data_type, table, deletion_fn) {
    // Define the action options for the table
    var actionOptions = {
        classes: [],
        contextMenu: {
            enabled: true,
            isMulti: true,
            xoffset: -10,
            yoffset: -10,
            headerRenderer: function (rows) {
                if (rows.length > 1) {
                    return rows.length + ' items selected';
                } else {
                    return 'Quick action';
                }
            },
        },
        buttonList: {
            enabled: false,
        },
        deselectAfterAction: true,
        items: [],
    };

    // Define a mapping of data types to their corresponding API endpoints
    const datatype_map = {
        'task': 'tasks',
        'ioc': 'ioc',
        'evidence': 'evidences',
        'note': 'notes',
        'asset': 'assets',
        'event': 'timeline/events'
    }

    // Send a request to get the menu options for the given data type
    get_request_api("/dim/hooks/options/"+ data_type +"/list")
    .done((data) => {
        // If the request is successful, add the menu options to the action options
        if(notify_auto_api(data, true)) {
            if (data.data != null) {
                let jsdata = data.data;

                // Add the "Share" option to the action options
                actionOptions.items.push({
                    type: 'option',
                    title: 'Share',
                    multi: false,
                    iconClass: 'fas fa-share',
                    action: function(rows){
                        let row = rows[0];
                        copy_object_link(get_row_id(row));
                    }
                });

                // Add the "Comment" option to the action options
                actionOptions.items.push({
                    type: 'option',
                    title: 'Comment',
                    multi: false,
                    iconClass: 'fas fa-comments',
                    action: function(rows){
                        let row = rows[0];
                        if (data_type in datatype_map) {
                            comment_element(get_row_id(row), datatype_map[data_type]);
                        }
                    }
                });

                // Add the "Markdown Link" option to the action options
                actionOptions.items.push({
                    type: 'option',
                    title: 'Markdown Link',
                    multi: false,
                    iconClass: 'fa-brands fa-markdown',
                    action: function(rows){
                        let row = rows[0];
                        copy_object_link_md(data_type, get_row_id(row));
                    }
                });

                // Add a divider to the action options
                actionOptions.items.push({
                    type: 'divider'
                });
                jdata_menu_options = jsdata;

                // Add each menu option to the action options
                for (let option in jsdata) {
                    let opt = jsdata[option];

                    actionOptions.items.push({
                        type: 'option',
                        title: opt.manual_hook_ui_name,
                        multi: true,
                        multiTitle: opt.manual_hook_ui_name,
                        iconClass: 'fas fa-rocket',
                        contextMenuClasses: ['text-dark'],
                        action: function (rows, de) {
                            init_module_processing_wrap(rows, data_type, de[0].outerText);
                        },
                    })
                }

                // If a deletion function is provided, add the "Delete" option to the action options
                if (deletion_fn !== undefined) {
                    actionOptions.items.push({
                        type: 'divider',
                    });

                    actionOptions.items.push({
                        type: 'option',
                        title: 'Delete',
                        multi: false,
                        iconClass: 'fas fa-trash',
                        contextMenuClasses: ['text-danger'],
                        action: function(rows){
                            let row = rows[0];
                            deletion_fn(get_row_id(row));
                        }
                    });
                }

                // Create the table actions object and update it with the action options
                let tableActions = table.contextualActions(actionOptions);
                tableActions.update();
            }
        }
    })
}


/**
 * Retrieves the values of custom attributes fields and returns them in an array.
 * 
 * @returns {Array} An array containing the values of the custom attributes fields.
 */
export function get_custom_attributes_fields() {
    let values = Object();
    let has_error = [];

    // Retrieve the values of input fields
    $("input[id^='inpstd_']").each(function (i, el) {
        let tab = $(el).attr('data-ref-tab');
        let field = $(el).attr('data-attr-for');
        if (!(tab in values)) { values[tab] = {} }

        values[tab][field] = $(el).val();
        if ($(el).prop('required') && !values[tab][field]) {
            $(el).parent().addClass('has-error');
            has_error.push(field);
        } else {
             $(el).parent().removeClass('has-error');
        }
    })

    // Retrieve the values of textarea fields
    $("textarea[id^='inpstd_']").each(function (i, el) {
        let tab = $(el).attr('data-ref-tab');
        let field = $(el).attr('data-attr-for');
        if (!(tab in values)) { values[tab] = {} }
        values[tab][field] = $(el).val();
        if ($(el).prop('required') && !values[tab][field]) {
            $(el).parent().addClass('has-error');
            has_error.push(field);
        } else {
             $(el).parent().removeClass('has-error');
        }
    })

    // Retrieve the values of checkbox fields
    $("input[id^='inpchk_']").each(function (i, el) {
        let tab = $(el).attr('data-ref-tab');
        let field = $(el).attr('data-attr-for');
        if (!(tab in values)) { values[tab] = {} }
        values[tab][field] = $(el).is(':checked');
    })

    // Retrieve the values of select fields
    $("select[id^='inpselect_']").each(function (i, el) {
        let tab = $(el).attr('data-ref-tab');
        let field = $(el).attr('data-attr-for');
        if (!(tab in values)) { values[tab] = {} }
        values[tab][field] = $(el).val();
        if ($(el).prop('required') && !values[tab][field]) {
            $(el).parent().addClass('has-error');
            has_error.push(field);
        } else {
             $(el).parent().removeClass('has-error');
        }
    })

    // Notify the user if any required fields are missing
    if (has_error.length > 0) {
        let msg = 'Missing required fields: <br/>';
        for (let field in has_error) {
            msg += '  - ' + has_error[field] + '<br/>';
        }
        notify_error(msg);
    }

    return [has_error, values];
}

/**
 * Updates the current time in the UI.
 */
export function update_time() {
    $('#current_date').text((new Date()).toLocaleString().slice(0, 17));
}

/**
 * Downloads a file with the given filename, content type, and data.
 * 
 * @param {string} filename - The name to give the downloaded file.
 * @param {string} contentType - The content type of the file.
 * @param {string} data - The data to include in the file.
 */
export function download_file(filename, contentType, data) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:' + contentType + ';charset=utf-8,' + encodeURIComponent(data));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

/**
 * Toggles focus mode on or off for all elements with the "modal-case-focus" class.
 */
export function toggle_focus_mode() {
    let class_a = "bg-focus-gradient"
    $(".modal-case-focus").each(function (i, el)  {
        if ($(el).hasClass( class_a )) {
            $(el).removeClass(class_a, 1000);
        } else {
            $(el).addClass(class_a, 1000);
        }
    });
}

/**
 * Maximizes a modal with the given ID.
 * 
 * @param {string} id - The ID of the modal to maximize.
 */
export function modal_maximize(id) {
    $("#" + id).modal("show");
    $("#minimized_modal_box").hide();
}

/**
 * Minimizes a modal with the given ID and title.
 * 
 * @param {string} id - The ID of the modal to minimize.
 * @param {string} title - The title to display in the minimized modal box.
 */
export function modal_minimized(id, title) {
    $("#" + id).modal("hide");
    $("#minimized_modal_title").text(title);
    $('#minimized_modal_box').data('target-id',id);
    $("#minimized_modal_box").show();
}

/**
 * Hides the minimized modal box and clears its contents.
 */
export function hide_minimized_modal_box() {
    $("#minimized_modal_box").hide();
    $("#minimized_modal_title").text('');
    $('#minimized_modal_box').data('target-id','');
}

/**
 * Hides the search input for table columns that are set to false in the given array.
 * 
 * @param {Array} columns - An array of boolean values indicating whether each table column should be displayed.
 */
export function hide_table_search_input(columns) {
    for (let i=0; i<columns.length; i++) {
      if (columns[i]) {
        $('.filters th:eq(' + i + ')' ).show();
      } else {
        $('.filters th:eq(' + i + ')' ).hide();
      }
    }
}

/**
 * Loads the context switcher by making an AJAX request to retrieve the data and populating the select picker.
 */
function load_context_switcher() {

    // Set the options for the select picker
    var options = {
        ajax: {
            url: '/context/search-cases'+ case_param(),
            type: 'GET',
            dataType: 'json'
        },
        locale: {
            emptyTitle: 'Select and Begin Typing',
            statusInitialized: '',
        },
        preprocessData: function (data) {
            return context_data_parser(data);
        },
        preserveSelected: false
    };

    // Make an AJAX request to retrieve the data and populate the select picker
    get_request_api('/context/get-cases/100')
    .done((data) => {
        context_data_parser(data);
        $('#user_context').ajaxSelectPicker(options);
    });
}

/**
 * Parses the context data and populates the select picker with the appropriate options.
 * 
 * @param {Object} data - The context data to parse.
 * @returns {Array} An array of objects containing the value and text for each option in the select picker.
 */
function context_data_parser(data) {
    if(notify_auto_api(data, true)) {
        $('#user_context').empty();

        // Create optgroups for opened and closed cases
        $('#user_context').append('<optgroup label="Opened" id="switch_case_opened_opt"></optgroup>');
        $('#user_context').append('<optgroup label="Closed" id="switch_case_closed_opt"></optgroup>');

        // Iterate through the context data and add options to the appropriate optgroup
        let ocs = data.data;
        let ret_data = [];
        for (let index in ocs) {
            let case_name = sanitizeHTML(ocs[index].name);
            let cs_name = sanitizeHTML(ocs[index].customer_name);
            ret_data.push({
                'value': ocs[index].case_id,
                'text': `${case_name} (${cs_name}) ${ocs[index].access}`
            });
            if (ocs[index].close_date != null) {
                $('#switch_case_closed_opt').append(`<option value="${ocs[index].case_id}">${case_name} (${cs_name}) ${ocs[index].access}</option>`);
            } else {
                $('#switch_case_opened_opt').append(`<option value="${ocs[index].case_id}">${case_name} (${cs_name}) ${ocs[index].access}</option>`)
            }
        }

        // Show the modal and refresh the select picker
        $('#modal_switch_context').modal("show");
        $('#user_context').selectpicker('refresh');
        $('#user_context').selectpicker('val', get_caseid());
        return ret_data;
    }
} 

/**
 * Focuses on the input field for changing the case number and sets up a keydown event listener to handle the Enter key.
 */
export function focus_on_input_chg_case(){
    $('#goto_case_number_input').focus();
    $('#goto_case_number_input').keydown(function(event) {
        if (event.keyCode == 13) {
             goto_case_number();
             return false;
        }
  });
}

/**
 * Splits a string by "AND" and returns the first element.
 * 
 * @param {string} split_str - The string to split.
 * @returns {string|null} The first element of the split string, or null if the string cannot be split.
 */
export function split_bool(split_str) {
    let and_split = split_str.split(' AND ');

    if (and_split[0]) {
      return and_split[0];
    }

    return null;
}

/**
 * Generates a random filename of the given length.
 * 
 * @param {number} length - The length of the filename to generate.
 * @returns {string} The generated filename.
 */
export function random_filename(length) {
    var filename           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var char_length = characters.length;
    for ( var i = 0; i < length; i++ ) {
      filename += characters.charAt(Math.random() * 1000 % char_length);
   }
   return filename;
}

/**
 * Creates a pagination component with the given parameters and appends it to the specified pagination container(s).
 * 
 * @param {number} currentPage - The current page number.
 * @param {number} totalPages - The total number of pages.
 * @param {number} per_page - The number of items per page.
 * @param {function} callback - The function to call when a pagination button is clicked.
 * @param {string|Array} paginationContainersNodes - The selector(s) for the pagination container(s).
 */
export function createPagination(currentPage, totalPages, per_page, callback, paginationContainersNodes) {
  const maxPagesToShow = 5;
  const paginationContainers = $(paginationContainersNodes);

  // If there is only one page or no pages, clear the pagination containers and return
  if (totalPages === 1 || totalPages === 0) {
    paginationContainers.html('');
    return;
  }

  // Iterate through each pagination container
  paginationContainers.each(function() {
    const paginationContainer = $(this);
    paginationContainer.html('');

    // Calculate the start and end pages to show
    const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    // Add the "First page" button if there are more pages than the maximum number of pages to show
    if (totalPages > maxPagesToShow) {
      if (currentPage !== 1 && maxPagesToShow / 2 + 1 < currentPage) {
        const firstItem = $('<li>', {class: 'page-item'}).appendTo(paginationContainer);
        $('<a>', {
          href: `javascript:${callback}(1, ${per_page},{}, true)`,
          text: 'First page',
          class: 'page-link',
        }).appendTo(firstItem);
      }
    }

    // Add the "Previous" button if the current page is not the first page
    if (currentPage !== 1) {
      const prevItem = $('<li>', { class: 'page-item' }).appendTo(paginationContainer);
      $('<a>', {
        href: `javascript:${callback}(${Math.max(1, currentPage - 1)}, ${per_page},{}, true)`,
        text: 'Previous',
        class: 'page-link',
      }).appendTo(prevItem);
    }

    // Add the page numbers
    for (let i = startPage; i <= endPage; i++) {
      const pageItem = $('<li>', { class: 'page-item' }).appendTo(paginationContainer);
      if (i === currentPage) {
        pageItem.addClass('active');
      }
      $('<a>', {
        href: `javascript:${callback}(${i}, ${per_page},{}, true)`,
        text: i,
        class: 'page-link',
      }).appendTo(pageItem);
    }

    // Add the "Next" button if the current page is not the last page
    if (currentPage !== totalPages) {
      const nextItem = $('<li>', { class: 'page-item' }).appendTo(paginationContainer);
      $('<a>', {
        href: `javascript:${callback}(${Math.min(totalPages, currentPage + 1)}, ${per_page},{}, true)`,
        text: 'Next',
        class: 'page-link',
      }).appendTo(nextItem);
    }

    // Add the "Last page" button if there are more pages than the maximum number of pages to show
    if (totalPages > maxPagesToShow) {
      if (currentPage !== totalPages) {
        const lastItem = $('<li>', {class: 'page-item'}).appendTo(paginationContainer);
        $('<a>', {
          href: `javascript:${callback}(${totalPages}, ${per_page},{}, true)`,
          text: 'Last page',
          class: 'page-link',
        }).appendTo(lastItem);
      }
    }
  });
}

/**
 * Retrieves the user's information from the server and stores it in sessionStorage.
 * 
 * @param {boolean} force - Whether to force a request to the server even if the user's information is already stored in sessionStorage.
 */
let userWhoami = JSON.parse(sessionStorage.getItem('userWhoami'));
export function userWhoamiRequest(force = false) {
  if (!userWhoami || force) {
    // Make an AJAX request to retrieve the user's information
    get_request_api('/user/whoami')
      .done((data) => {
        // If the request is successful, store the user's information in sessionStorage
        if (notify_auto_api(data, true)) {
            userWhoami = data.data;
          sessionStorage.setItem('userWhoami', JSON.stringify(userWhoami));
        }
      });
  }
}

/**
 * Toggles the sidebar between minimized and expanded states and sends a request to the server to update the user's preference.
 */
$('.toggle-sidebar').on('click', function() {
    if ($('.wrapper').hasClass('sidebar_minimize')) {
        // If the sidebar is minimized, expand it and send a request to the server to update the user's preference
        $('.wrapper').removeClass('sidebar_minimize');
        get_request_api('/user/mini-sidebar/set/false')
            .then((data) => {
                notify_auto_api(data, true);
            });
    } else {
        // If the sidebar is expanded, minimize it and send a request to the server to update the user's preference
        $('.wrapper').addClass('sidebar_minimize');
        get_request_api('/user/mini-sidebar/set/true')
            .then((data) => {
                notify_auto_api(data, true);
            });
    }
});

/**
 * Prompts the user for confirmation before performing a deletion action.
 * 
 * @param {string} message - The message to display in the confirmation prompt.
 * @param {boolean} force_prompt - Whether to force the prompt to appear even if the user has previously confirmed deletions.
 * @returns {Promise<boolean>} A Promise that resolves to true if the user confirms the deletion, or false otherwise.
 */
export function do_deletion_prompt(message, force_prompt=false) {
    // Check if the user has previously confirmed deletions or if the prompt should be forced
    if (userWhoami.has_deletion_confirmation || force_prompt) {
        // If so, create a Promise that resolves to the user's confirmation choice
        return new Promise((resolve, reject) => {
            swal({
                title: "Are you sure?",
                text: message,
                icon: "warning",
                buttons: {
                    cancel: {
                        text: "Cancel",
                        value: false,
                        visible: true,
                        closeModal: true
                    },
                    confirm: {
                       text: "Confirm",
                       value: true
                    }
                },
                dangerMode: true
            })
            .then((willDelete) => {
                resolve(willDelete);
            })
            .catch((error) => {
                reject(error);
            });
        });
    } else {
        // If not, create a Promise that immediately resolves to true
        return new Promise((resolve) => {
            resolve(true);
        });
    }
}

/**
 * Initializes various features of the page on load.
 */
$(function(){
    // Redirects the user to the appropriate page if necessary
    notify_redirect();

    // Updates the time on the page every 30 seconds
    update_time();
    setInterval(function() { update_time(); }, 30000);

    // Sets the active navigation tab based on the current URL
    var current = location.pathname;
    let btt = current.split('/')[1];

    if (btt !== 'manage') {
        btt = btt.split('?')[0];
    } else {
        let csp = current.split('?')[0].split('/')
        if (csp.length >= 3) {
            csp = csp.splice(0, 3);
        }
        btt = csp.join('/');
    }

    $('#l_nav_tab .nav-item').each(function (k, al) {
        let href = $(al).children().attr('href');
        let att = "";
        try {
            if (href == "#advanced-nav") {
                $('#advanced-nav .nav-subitem').each(function (i, el) {
                    let ktt = $(el).children().attr('href').split('?')[0];
                    if (ktt === btt) {
                        $(el).addClass('active');
                        $(al).addClass('active');
                        $(al).children().attr('aria-expanded', true);
                        $('#advanced-nav').show();
                        return false;
                    }
                });
            } else if (href.startsWith(btt)){
                $(this).addClass('active');
                return false;
            }else{
                att = href.split('/')[1].split('?')[0];
            }
        } catch {att=""}
        if (att === btt) {
            $(al).addClass('active');
            return false;
        }
    })

    // Handles the submission of the context switcher form
    $('#submit_set_context').on("click", function () {
        var data_sent = new Object();
        data_sent.ctx = $('#user_context').val();
        data_sent.ctx_h = $("#user_context option:selected").text();
        post_request_api('/context/set?cid=' + data_sent.ctx, data_sent)
        .done((data) => {
            if(notify_auto_api(data, true)) {
                $('#modal_switch_context').modal('hide');
                swal({
                    title: 'Context changed successfully',
                    text: 'Reloading...',
                    icon: 'success',
                    timer: 300,
                    buttons: false,
                })
                .then(() => {
                    var newURL = updateURLParameter(window.location.href, 'cid', data_sent.ctx);
                    window.history.replaceState('', '', newURL);
                    location.reload();
                })
            }
        });
    });

    // Initializes the popover feature (currently commented out)
    $(function () {
        // new Popover({selector: '[data-toggle="popover"]', trigger: 'focus', placement: 'auto', container: 'body', html: true});
        // $('[data-toggle="popover"]').popover({
        //     trigger: 'focus',
        //     placement: 'auto',
        //     container: 'body',
        //     html: true
        // });
    });

    // Makes the modal dialog draggable
    $('.modal-dialog').draggable({
        handle: ".modal-header"
    });

    // Handles the submission of the task log form
    $('#form_add_tasklog').on('submit', function () {
        event.preventDefault();
        event.stopImmediatePropagation();
        var data = $('form#form_add_tasklog').serializeObject();
        data['csrf_token'] = $('#csrf_token').val();

        post_request_api('/case/tasklog/add', JSON.stringify(data), true)
        .done(function (data){
            if(notify_auto_api(data)){
                $('#modal_add_tasklog').modal('hide');
            }
        });
        return false;
    });

    // Adds support for Bootstrap tables using the Showdown extension
    showdown.extension('bootstrap-tables', function () {
      return [{
        type: "output",
        filter: function (html) {
          // parse the html string
          var liveHtml = $('<div></div>').html(html);
          $('table', liveHtml).each(function(){
            var table = $(this);

            // table bootstrap classes
            table.addClass('table table-striped table-bordered table-hover table-sm')
            // make table responsive
            .wrap('<div class="table-responsive"></div>');
          });
          return liveHtml.html();
        }
          }];
    });

    // Register all events 
    setOnClickEventFromMap(commonEventsMap, commonClickEventNamespace);

    // Retrieves the user's information from the server
    userWhoamiRequest();
});

