const roots = {
    case: "/case",
    context: "/context",
    datastore: "/datastore",
    dim: "/dim",
    manage: "/manage",
    user: "/user",
}


const endpoints = {
    // Case
    case: {
        root: roots.case,
        // List activities related to a case
        activities_list: roots.case + "/activities/list",
        add_task_log: roots.case + "/tasklog/add",
        details: roots.case + "/details/", // + case id
        pipeline: {
            modal: roots.case + "/pipelines-modal",
        },
        report: {
            gen_investigation: roots.case + "/report/generate-investigation/", // report template id
            gen_activities: roots.case + "/report/generate-activities/", // report template id
        },
        summary: {
            get: roots.case + "/summary/fetch",
            set: roots.case + "/summary/update",
        },
    },

    // Context
    context: {
        root: roots.case,
        get_cases: roots.context + "/get-cases/", // + Number of results
        search_cases: roots.context + "/search-cases",
        set: roots.context + "/set",
    },

    // Datastore
    ds: {
        root: roots.datastore,
        add_file_interactive: roots.datastore + "/file/add-interactive",
    },

    // Dim tasks
    dim: {
        root: roots.dim,
        tasks_status: "/dim/tasks/status", // + ID of the task
        list_tasks: "/dim/tasks/list", // + number of results
        hooks_options: "/dim/hooks/options/", // + hook type
    },

    // Manage
    manage: {
        root: roots.manage,
        cases: {
            view: roots.manage + "/cases", // + case id in cid and #view in hash
        }
    },

    // User 
    user: {
        root: roots.user,
        whoami: roots.user + "/whoami",
        set_mini_siderbar: roots.user + "/mini-sidebar/set/true",
        unset_mini_siderbar: roots.user + "/mini-sidebar/set/false",
    }
};

// Export the API map
export default endpoints;