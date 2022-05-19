
import { apiGet, getConfiguration } from './apiProvider';

const sharepointSiteId = "7lcpdm.sharepoint.com,bf9359de-0f13-4b00-8b5a-114f6ef3bfb0,6609a994-5225-4a1d-bd05-a239c7b45f72";

export async function getOrganisationList(country) {
    const config = await getConfiguration();
    try {
        let path = "/sites/" + sharepointSiteId + "/lists/" + config.OrganisationListId + "/items?$expand=fields"
        if (country) {
            path += "&$filter=fields/Country eq '" + country + "' or fields/Unspecified eq 1";
        }
        const response = await apiGet(path);
        return response.graphClientMessage.value.map(function (organisation) {
            return {
                header: organisation.fields.Title,
                content: organisation.id,
                unspecified: organisation.fields.Unspecified,
            };
        });
    }
    catch (err) {
        console.log(err);
        return [];
    }
}

export async function getSPUserByMail(email) {
    const config = await getConfiguration();
    try {
        const path = "/sites/" + sharepointSiteId + "/lists/" + config.UserListId + "/items?$filter=fields/Email eq '" + email + "'&$expand=fields",
            response = await apiGet(path),
            profile = response.graphClientMessage;
        if (profile.value && profile.value.length) {
            return profile.value[0];
        }
        return undefined;

    }
    catch (err) {
        console.log(err);
    }
}

