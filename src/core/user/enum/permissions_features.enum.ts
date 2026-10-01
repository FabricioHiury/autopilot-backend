export enum PERMISSIONS_STORE {
  STORE_VIEW_DASHBOARD = 'storeViewDashboard',
  STORE_VIEW_DEALS = 'storeViewDeals',
  STORE_EDIT_DELETE_DEAL = 'storeEditDeleteDeal',
  STORE_LINK_DEAL_USER = 'storeLinkDealUser',
  STORE_TRANSFER_DEAL = 'storeTransferDeal',
  STORE_VIEW_CHAT = 'storeViewChat',
  STORE_REPLY_CHAT = 'storeReplyChat',
  STORE_REGISTER_EDIT_CUSTOMERS = 'storeRegisterEditCustomers',
  STORE_SEARCH_CUSTOMERS = 'storeSearchCustomers',
  STORE_MANAGE_USERS = 'storeManageUsers',
  STORE_MANAGE_ROLES = 'storeManageRoles',
  STORE_CONFIGURE_INTEGRATIONS = 'storeConfigureIntegrations',
  STORE_EDIT_DATA_OF_STORE = 'storeEditDataOfStore',
  STORE_MANAGE_SUSPENSIONS = 'storeManageSuspensions',
  STORE_VIEW_ALL_DEALS = 'storeViewAllDeals',
  STORE_CREATE_DEAL_MANUAL = 'storeCreateDealManual',
  STORE_REASSIGN_DEALS = 'storeReassignDeals',
  STORE_MANAGE_TEAM = 'storeManageTeam',
  STORE_VIEW_DEALS_OWN = 'storeViewDealsOwn',
  STORE_CREATE_DEAL_OWN = 'storeCreateDealOwn',
  STORE_MANAGE_TASKS_OWN = 'storeManageTasksOwn',
  STORE_PRE_SALESPERSON_FINALIZE_DEAL = 'storePreSalespersonFinalizeDeal',
  STORE_VIEW_MESSAGES_TEMPLATE = 'storeViewMessagesTemplate',
  STORE_CREATE_MESSAGE_TEMPLATE = 'storeCreateMessageTemplate',
  STORE_EDIT_MESSAGE_TEMPLATE = 'storeEditMessageTemplate',
  STORE_DELETE_MESSAGE_TEMPLATE = 'storeDeleteMessageTemplate',
}

export enum PERMISSIONS_AUTOPILOT {
  AUTOPILOT_VIEW_DASHBOARD = 'autopilotViewDashboard',
  AUTOPILOT_REPLY_TICKETS = 'autopilotReplyTickets',
  AUTOPILOT_VIEW_TICKETS = 'autopilotViewTickets',
  AUTOPILOT_UPDATE_PANEL_RESELLER = 'autopilotUpdatePanelReseller',
  AUTOPILOT_UPDATE_PERMISSIONS = 'autopilotUpdatePermissions',
  AUTOPILOT_CREATE_USER_ADMIN = 'autopilotCreateUserAdmin',
  AUTOPILOT_VIEW_USERS_ADMIN = 'autopilotViewUsersAdmin',
}

export const PERMISSIONS_ALL = {
  ...PERMISSIONS_STORE,
  ...PERMISSIONS_AUTOPILOT,
};
