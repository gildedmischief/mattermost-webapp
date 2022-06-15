// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import configureStore from 'redux-mock-store';
import {Provider} from 'react-redux';

import {mountWithIntl} from 'tests/helpers/intl-test-helper';

import {CloudProducts} from 'utils/constants';
import {FileSizes} from 'utils/file_utils';
import {limitThresholds} from 'utils/limits';

import MenuCloudTrial from './menu_cloud_trial';

const usage = {
    files: {
        totalStorage: 0,
        totalStorageLoaded: true,
    },
    messages: {
        history: 0,
        historyLoaded: true,
    },
    boards: {
        cards: 0,
        cardsLoaded: true,
    },
    integrations: {
        enabled: 0,
        enabledLoaded: true,
    },
    teams: {
        active: 0,
        cloudArchived: 0,
        teamsLoaded: true,
    },
};

const limits = {
    limitsLoaded: true,
    limits: {
        integrations: {
            enabled: 5,
        },
        messages: {
            history: 10000,
        },
        files: {
            total_storage: 10 * FileSizes.Gigabyte,
        },
        teams: {
            active: 1,
            teamsLoaded: true,
        },
        boards: {
            cards: 500,
            views: 5,
        },
    },
};

const users = {
    currentUserId: 'uid',
    profiles: {
        uid: {},
    },
};

describe('components/widgets/menu/menu_items/menu_cloud_trial', () => {
    const mockStore = configureStore();

    test('should render when on cloud license and during free trial period', () => {
        const FOURTEEN_DAYS = 1209600000; // in milliseconds
        const subscriptionCreateAt = Date.now();
        const subscriptionEndAt = subscriptionCreateAt + FOURTEEN_DAYS;
        const state = {
            entities: {
                general: {
                    license: {
                        IsLicensed: 'true',
                        Cloud: 'true',
                    },
                },
                cloud: {
                    subscription: {
                        is_free_trial: 'true',
                        trial_end_at: subscriptionEndAt,
                    },
                    limits,
                },
                usage,
            },
        };
        const store = mockStore(state);
        const wrapper = mountWithIntl(<Provider store={store}><MenuCloudTrial id='menuCloudTrial'/></Provider>);
        expect(wrapper.find('UpgradeLink').exists()).toEqual(true);
    });

    test('should NOT render when NOT on cloud license and NOT during free trial period', () => {
        const state = {
            entities: {
                users,
                general: {
                    license: {
                        IsLicensed: 'false',
                    },
                },
                cloud: {
                    customer: null,
                    subscription: null,
                    products: null,
                    invoices: null,
                    limits,
                },
                usage,
            },
        };
        const store = mockStore(state);
        const wrapper = mountWithIntl(<Provider store={store}><MenuCloudTrial id='menuCloudTrial'/></Provider>);
        expect(wrapper.find('UpgradeLink').exists()).toEqual(false);
    });

    test('should NOT render when NO license is available', () => {
        const state = {
            entities: {
                users,
                general: {},
                cloud: {
                    customer: null,
                    subscription: null,
                    products: null,
                    invoices: null,
                    limits,
                },
                usage,
            },
        };
        const store = mockStore(state);
        const wrapper = mountWithIntl(<Provider store={store}><MenuCloudTrial id='menuCloudTrial'/></Provider>);
        expect(wrapper.find('UpgradeLink').exists()).toEqual(false);
    });

    test('should NOT render when is cloud and not on a trial', () => {
        const state = {
            entities: {
                users,
                general: {
                    license: {
                        IsLicensed: 'true',
                        Cloud: 'true',
                    },
                },
                cloud: {
                    subscription: {
                        is_free_trial: 'false',
                        trial_end_at: 0,
                    },
                    limits,
                },
                usage,
            },
        };
        const store = mockStore(state);
        const wrapper = mountWithIntl(<Provider store={store}><MenuCloudTrial id='menuCloudTrial'/></Provider>);
        expect(wrapper.find('.open-learn-more-trial-modal').exists()).toEqual(false);
        expect(wrapper.find('UpgradeLink').exists()).toEqual(false);
    });

    test('should invite to start trial when the subscription is not paid and have not had trial before', () => {
        const state = {
            entities: {
                users,
                general: {
                    license: {
                        IsLicensed: 'true',
                        Cloud: 'true',
                    },
                },
                cloud: {
                    subscription: {
                        is_free_trial: 'false',
                        trial_end_at: 0,
                        product_id: 'prod_starter',
                    },
                    products: {
                        prod_starter: {
                            id: 'prod_starter',
                            sku: CloudProducts.STARTER,
                        },
                    },
                    limits,
                },
                usage,
            },
        };
        const store = mockStore(state);
        const wrapper = mountWithIntl(<Provider store={store}><MenuCloudTrial id='menuCloudTrial'/></Provider>);
        expect(wrapper.find('.open-learn-more-trial-modal').exists()).toEqual(true);
    });

    test('should show the open trial benefits modal when is is free trial', () => {
        const state = {
            entities: {
                users,
                general: {
                    license: {
                        IsLicensed: 'true',
                        Cloud: 'true',
                    },
                },
                cloud: {
                    subscription: {
                        product_id: 'prod_starter',
                        is_free_trial: 'true',
                        trial_end_at: 12345,
                    },
                    products: {
                        prod_starter: {
                            id: 'prod_starter',
                            sku: CloudProducts.STARTER,
                        },
                    },
                    limits,
                },
                usage,
            },
        };
        const store = mockStore(state);
        const wrapper = mountWithIntl(<Provider store={store}><MenuCloudTrial id='menuCloudTrial'/></Provider>);
        const openModalLink = wrapper.find('.open-trial-benefits-modal');
        expect(openModalLink.exists()).toEqual(true);
        expect(openModalLink.find('span').text()).toBe('Review our Enterprise Features');
    });

    test('should show the invitation to see plans when is not in Trial and has had previous Trial', () => {
        const state = {
            entities: {
                users,
                general: {
                    license: {
                        IsLicensed: 'true',
                        Cloud: 'true',
                    },
                },
                cloud: {
                    subscription: {
                        is_free_trial: 'false',
                        trial_end_at: 232434,
                        product_id: 'prod_starter',
                    },
                    products: {
                        prod_starter: {
                            id: 'prod_starter',
                            sku: CloudProducts.STARTER,
                        },
                    },
                    limits,
                },
                usage,
            },
        };
        const store = mockStore(state);
        const wrapper = mountWithIntl(<Provider store={store}><MenuCloudTrial id='menuCloudTrial'/></Provider>);
        const openModalLink = wrapper.find('.open-see-plans-modal');
        expect(openModalLink.exists()).toEqual(true);
        expect(openModalLink.find('span').text()).toBe('See plans');
    });

    test('should return null if some limit needs attention', () => {
        const state = {
            entities: {
                users,
                general: {
                    license: {
                        IsLicensed: 'true',
                        Cloud: 'true',
                    },
                },
                cloud: {
                    subscription: {
                        product_id: 'prod_starter',
                        is_free_trial: 'false',
                        trial_end_at: 232434,
                    },
                    products: {
                        prod_starter: {
                            id: 'prod_starter',
                            sku: CloudProducts.STARTER,
                        },
                    },
                    limits,
                },
                usage: {
                    ...usage,
                    messages: {
                        ...usage.messages,
                        history: Math.ceil((limitThresholds.warn / 100) * limits.limits.messages.history) + 1,
                    },
                },
            },
        };
        const store = mockStore(state);
        const wrapper = mountWithIntl(<Provider store={store}><MenuCloudTrial id='menuCloudTrial'/></Provider>);
        expect(wrapper.find('UpgradeLink').exists()).toEqual(false);
        expect(wrapper.find('.open-see-plans-modal').exists()).toEqual(false);
        expect(wrapper.find('.open-learn-more-trial-modal').exists()).toEqual(false);
        expect(wrapper.find('.open-trial-benefits-modal').exists()).toEqual(false);
    });
});
