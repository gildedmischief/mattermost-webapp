// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useEffect} from 'react';
import {useSelector, useDispatch} from 'react-redux';

import {GlobalState} from 'mattermost-redux/types/store';
import {DispatchFunc} from 'mattermost-redux/types/actions';
import {PreferenceType} from 'mattermost-redux/types/preferences';
import {getStandardAnalytics} from 'mattermost-redux/actions/admin';
import {getConfig} from 'mattermost-redux/selectors/entities/general';
import {makeGetCategory} from 'mattermost-redux/selectors/entities/preferences';
import {getCurrentUser, isCurrentUserSystemAdmin} from 'mattermost-redux/selectors/entities/users';
import {savePreferences} from 'mattermost-redux/actions/preferences';

import {openModal} from 'actions/views/modals';

import {
    Preferences,
    Constants,
    TELEMETRY_CATEGORIES,
    ModalIdentifiers,
} from 'utils/constants';

import StartTrialModal from 'components/start_trial_modal';

import {trackEvent} from 'actions/telemetry_actions';

const ShowStartTrialModal = () => {
    const isUserAdmin = useSelector((state: GlobalState) => isCurrentUserSystemAdmin(state));
    if (!isUserAdmin) {
        return null;
    }

    const dispatch = useDispatch<DispatchFunc>();
    const getCategory = makeGetCategory();

    const userThreshold = 10;
    const analytics = useSelector((state: GlobalState) => state.entities.admin.analytics);
    const installationDate = useSelector((state: GlobalState) => getConfig(state).InstallationDate);
    const currentUser = useSelector((state: GlobalState) => getCurrentUser(state));
    const preferences = useSelector<GlobalState, PreferenceType[]>((state) => getCategory(state, Preferences.START_TRIAL_MODAL));

    const handleOnClose = () => {
        trackEvent(
            TELEMETRY_CATEGORIES.SELF_HOSTED_START_TRIAL_AUTO_MODAL,
            'click_close_start_trial_auto_modal',
        );
        dispatch(savePreferences(currentUser.id, [
            {
                category: Preferences.START_TRIAL_MODAL,
                user_id: currentUser.id,
                name: Constants.TRIAL_MODAL_AUTO_SHOWN,
                value: 'true',
            },
        ]));
    };

    useEffect(() => {
        if (!analytics) {
            dispatch(getStandardAnalytics());
        }
    }, []);

    useEffect(() => {
        const installationDatePlus6Hours = (6 * 60 * 60 * 1000) + Number(installationDate);
        const now = new Date().getTime();
        const hasEnvMoreThan6Hours = now > installationDatePlus6Hours;
        const hadAdminDismissedModal = preferences.some((pref: PreferenceType) => pref.name === Constants.TRIAL_MODAL_AUTO_SHOWN && pref.value === 'true');
        if (Number(analytics?.TOTAL_USERS) > userThreshold && hasEnvMoreThan6Hours && !hadAdminDismissedModal) {
            dispatch(openModal({
                modalId: ModalIdentifiers.START_TRIAL_MODAL,
                dialogType: StartTrialModal,
                dialogProps: {onClose: handleOnClose},
            }));
        }
    }, [analytics]);

    return null;
};
export default ShowStartTrialModal;
