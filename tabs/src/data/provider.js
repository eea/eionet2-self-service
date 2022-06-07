import { apiGet, apiPatch, getConfiguration } from './apiProvider';
import { getSPUserByMail, getOrganisationList } from './sharepointProvider';

function wrapError(err, message) {
  return {
    Message: message,
    Error: err,
    Success: false,
  };
}

var genderList = [
  { id: 'Male', label: 'Mr.' },
  { id: 'Female', label: 'Ms.' },
];

var _profile = undefined;
export async function getMe() {
  if (!_profile) {
    const config = await getConfiguration(),
      response = await apiGet(
        'me?$select=id,displayName,mail,mobilePhone,country',
        'user'
      );

    const myProfile = response.graphClientMessage;
    if (myProfile) {
      const userData = await getUserByMail(myProfile.mail);
      if (userData.IsValid) {
        let spUser = userData.SharepointUser,
          organisations = await getOrganisationList(spUser.fields.Country),
          organisation = organisations.find(
            (o) => o.content === spUser.fields.OrganisationLookupId
          );

        _profile = {
          Title: spUser.fields.Title,
          Phone: spUser.fields.Phone,
          Email: spUser.fields.Email,
          Country: spUser.fields.Country,
          Memberships: spUser.fields.Membership,
          OtherMemberships: spUser.fields.OtherMemberships,
          FirstName: userData.ADUser.givenName,
          LastName: userData.ADUser.surname,
          Gender: spUser.fields.Gender,
          GenderTitle: spUser.fields.Gender
            ? genderList.find((g) => g.id === spUser.fields.Gender).label
            : '',
          OrganisationLookupId: spUser.fields.OrganisationLookupId,
          Organisation: organisation ? organisation.header : '',
          NFP: spUser.fields.NFP,
          SuggestedOrganisation: spUser.fields.SuggestedOrganisation,
          id: spUser.fields.id,
          IsValid: true,
          ADUserId: spUser.fields.ADUserId,
          SelfSeviceHelpdeskPreferencesText:
            config.SelfSeviceHelpdeskPreferencesText,
          SelfSeviceHelpdeskPersonalDetailsText:
            config.SelfSeviceHelpdeskPersonalDetailsText,
        };
      }
    }
  }
  return _profile;
}

export async function getUserByMail(email) {
  try {
    const adResponse = await apiGet("/users/?$filter=mail eq '" + email + "'"),
      spUser = await getSPUserByMail(email),
      adMessage = adResponse.graphClientMessage;

    const adUser =
      adMessage.value && adMessage.value.length
        ? adMessage.value[0]
        : undefined;

    return {
      ADUser: adUser,
      SharepointUser: spUser,
      IsValid: adUser !== undefined && spUser !== undefined,
    };
  } catch (err) {
    wrapError(err, 'getUserByMail');
    console.log(err);
    return undefined;
  }
}

async function saveADUser(userData) {
  let displayName =
    userData.FirstName +
    ' ' +
    userData.LastName +
    ' (' +
    userData.Country +
    ')';
  if (userData.NFP) {
    displayName =
      userData.FirstName +
      ' ' +
      userData.LastName +
      ' (NFP-' +
      userData.Country +
      ')';
  }
  await apiPatch('/users/' + userData.ADUserId, {
    givenName: userData.FirstName,
    surname: userData.LastName,
    displayName: displayName,
    department: 'Eionet',
  });
}

async function saveSPUser(userData) {
  const spConfig = await getConfiguration();
  let fields = {
    fields: {
      Phone: userData.Phone,
      Title: userData.FirstName + ' ' + userData.LastName,
      Gender: userData.Gender,
    },
  };

  let graphURL =
    '/sites/' +
    spConfig.SharepointSiteId +
    '/lists/' +
    spConfig.UserListId +
    '/items/' +
    userData.id;
  await apiPatch(graphURL, fields);
}

export async function saveData(user) {
  try {
    await saveADUser(user);
  } catch (err) {
    return wrapError(err, 'saveADUser');
  }

  try {
    await saveSPUser(user);
  } catch (err) {
    return wrapError(err, 'saveSPUser');
  }

  return { Success: true };
}
