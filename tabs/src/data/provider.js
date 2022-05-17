import { apiGet, apiPost, apiPatch, getConfiguration } from './apiProvider';
import { getSPUserByMail } from './sharepointProvider';
import messages from "./messages.json";

function wrapError(err, message) {
    return {
        Message: message,
        Error: err,
        Success: false
    }
}

var _profile = undefined;
export async function getMe() {
    if (!_profile) {
        const config = await getConfiguration(),
            response = await apiGet("me?$select=id,displayName,mail,mobilePhone,country", "user"),
            groups = await apiGet("me/memberOf", "user");

        const profile = response.graphClientMessage;
        if (groups.graphClientMessage) {
            let groupsList = groups.graphClientMessage.value;

            profile.isAdmin = groupsList.some(group => { return group.id === config.AdminGroupId });
            profile.isNFP = !profile.isAdmin && groupsList.some(group => { return group.id === config.NFPGroupId });
            profile.isGuest = !profile.isAdmin && !profile.isNFP;
        }
        _profile = profile;
    }
    return _profile;
}

export async function getUserByMail(email) {
    try {
        const adResponse = await apiGet("/users/?$filter=mail eq '" + email + "'"),
            spUser = await getSPUserByMail(email),
            adMessage = adResponse.graphClientMessage;

        const adUser = adMessage.value && adMessage.value.length ? adMessage.value[0] : undefined;

        return {
            ADUser: adUser,
            SharepointUser: spUser,
            Continue: (!adUser && !spUser) || (adUser && !spUser),
        }
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

export async function getUser(userId) {
    try {
        const response = await apiGet("/users/" + userId);
        return response.graphClientMessage;
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}


async function saveADUser(userId, userData) {
    let displayName = userData.FirstName + ' ' + userData.LastName + ' (' + userData.Country + ')';
    if (userData.NFP) {
        displayName = userData.FirstName + ' ' + userData.LastName + ' (NFP-' + userData.Country + ')';
    }
    await apiPatch("/users/" + userId, {
        givenName: userData.FirstName,
        surname: userData.LastName,
        displayName: displayName,
        department: 'Eionet',
        country: userData.Country
    });
}

async function sendOrgSuggestionNotification(info) {
    const config = await getConfiguration();
    if (config.HelpdeskEmail) {
        try {
            await apiPost("users/" + config.FromEmailAddress + "/sendMail",
                {
                    message: {
                        subject: config.NewOrganisationSuggestionSubject,
                        body: {
                            contentType: "Text",
                            content: config.NewOrganisationSuggestionMailBody + "  " + info,
                        },
                        toRecipients: [
                            {
                                emailAddress: {
                                    address: config.HelpdeskEmail
                                }
                            }
                        ]
                    },
                    saveToSentItems: true
                });
        }
        catch (err) {
            console.log(err);
            return false;
        }
    }
}

async function saveSPUser(userId, userData, newYN) {
    const spConfig = await getConfiguration();
    let fields =
    {
        fields: {
            Phone: userData.Phone,
            Email: userData.Email,
            Country: userData.Country,
            ...userData.Membership && {
                "Membership@odata.type": "Collection(Edm.String)",
                Membership: userData.Membership
            },
            ...userData.OtherMemberships && {
                "OtherMemberships@odata.type": "Collection(Edm.String)",
                OtherMemberships: userData.OtherMemberships,
            },
            Title: userData.FirstName + ' ' + userData.LastName,
            Gender: userData.Gender,
            Organisation: userData.Organisation,
            OrganisationLookupId: userData.OrganisationLookupId,
            ADUserId: userId,
            NFP: userData.NFP,
            SuggestedOrganisation: userData.SuggestedOrganisation,
        }
    };

    let graphURL = "/sites/" + spConfig.SharepointSiteId + "/lists/" + spConfig.UserListId + "/items";
    if (newYN) {
        await apiPost(graphURL, fields);
    } else {
        graphURL += "/" + userData.id;
        await apiPatch(graphURL, fields);
    }

    if (userData.SuggestedOrganisation) {
        sendOrgSuggestionNotification(userData.SuggestedOrganisation);
    }
}



export async function editUser(user, mappings, oldValues) {
    try {

        await saveADUser(user.ADUserId, user);
        await saveSPUser(user.ADUserId, user, false);

        return true;
    }
    catch (err) {
        console.log(err);
        return false;
    }
}



