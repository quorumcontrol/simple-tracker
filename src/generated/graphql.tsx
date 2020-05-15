import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type RequireFields<T, K extends keyof T> = { [X in Exclude<keyof T, K>]?: T[X] } & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  JSON: any;
};


export type User = {
   __typename?: 'User';
  did: Scalars['ID'];
  username?: Maybe<Scalars['String']>;
  namespace?: Maybe<Scalars['String']>;
  loggedIn?: Maybe<Scalars['Boolean']>;
  /** @deprecated only drivers are users now and this field used to represent a collection a user owns */
  collection?: Maybe<TrackableCollection>;
  pendingDeliveries?: Maybe<TrackableCollection>;
  completedDeliveries?: Maybe<TrackableCollection>;
};

export enum TrackableStatus {
  Created = 'Created',
  Published = 'Published',
  Accepted = 'Accepted',
  PickedUp = 'PickedUp',
  Delivered = 'Delivered'
}

export type Recipient = {
   __typename?: 'Recipient';
  did: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
  address?: Maybe<Address>;
  instructions?: Maybe<Scalars['String']>;
};

export type Trackable = {
   __typename?: 'Trackable';
  did: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
  image?: Maybe<Scalars['String']>;
  updates: TrackableUpdateConnection;
  collaborators?: Maybe<TrackableCollaboratorConnection>;
  status?: Maybe<TrackableStatus>;
  driver?: Maybe<User>;
  metadata?: Maybe<Array<MetadataEntry>>;
};

export type TrackableCollaboratorConnection = {
   __typename?: 'TrackableCollaboratorConnection';
  edges?: Maybe<Array<User>>;
};

export type TrackableUpdateConnection = {
   __typename?: 'TrackableUpdateConnection';
  edges?: Maybe<Array<TrackableUpdate>>;
};

export type TrackableUpdate = {
   __typename?: 'TrackableUpdate';
  did: Scalars['ID'];
  timestamp: Scalars['String'];
  message?: Maybe<Scalars['String']>;
  metadata?: Maybe<Array<MetadataEntry>>;
  userDid?: Maybe<Scalars['String']>;
  userName?: Maybe<Scalars['String']>;
  recipientDid?: Maybe<Scalars['String']>;
  recipientName?: Maybe<Scalars['String']>;
};

export type MetadataEntry = {
   __typename?: 'MetadataEntry';
  key: Scalars['String'];
  value?: Maybe<Scalars['JSON']>;
};

export type TrackableCollection = {
   __typename?: 'TrackableCollection';
  did: Scalars['ID'];
  trackables?: Maybe<Array<Trackable>>;
};

export type Address = {
   __typename?: 'Address';
  street?: Maybe<Scalars['String']>;
  cityStateZip?: Maybe<Scalars['String']>;
};

export type AppCollection = {
   __typename?: 'AppCollection';
  did: Scalars['ID'];
  trackables?: Maybe<Array<Trackable>>;
};

export type CreateTrackableInput = {
  name: Scalars['String'];
  image?: Maybe<Scalars['String']>;
  address?: Maybe<AddressInput>;
  instructions?: Maybe<Scalars['String']>;
};

export type AddressInput = {
  street: Scalars['String'];
  cityStateZip: Scalars['String'];
};

export type MetadataEntryInput = {
  key: Scalars['String'];
  value?: Maybe<Scalars['JSON']>;
};

export type AddUpdateInput = {
  trackable: Scalars['ID'];
  message: Scalars['String'];
  metadata?: Maybe<Array<MetadataEntryInput>>;
};

export type CreateTrackablePayload = {
   __typename?: 'CreateTrackablePayload';
  collection?: Maybe<TrackableCollection>;
  trackable?: Maybe<Trackable>;
};

export type AddUpdatePayload = {
   __typename?: 'AddUpdatePayload';
  update: TrackableUpdate;
};

export type AddCollaboratorPayload = {
   __typename?: 'AddCollaboratorPayload';
  collaborator?: Maybe<User>;
  code?: Maybe<Scalars['Int']>;
};

export type AddCollaboratorInput = {
  trackable: Scalars['ID'];
  username: Scalars['String'];
};

export type AcceptJobInput = {
  user: Scalars['ID'];
  trackable: Scalars['ID'];
};

export type AcceptJobPayload = {
   __typename?: 'AcceptJobPayload';
  trackable?: Maybe<Trackable>;
};

export type PickupInput = {
  user: Scalars['ID'];
  trackable: Scalars['ID'];
  imageUrl?: Maybe<Scalars['String']>;
};

export type PickupPayload = {
   __typename?: 'PickupPayload';
  trackable?: Maybe<Trackable>;
};

export type CompleteJobPayload = {
   __typename?: 'CompleteJobPayload';
  trackable?: Maybe<Trackable>;
  recipient?: Maybe<Recipient>;
};

export type CompleteJobInput = {
  user: Scalars['ID'];
  recipient: Scalars['ID'];
  trackable: Scalars['ID'];
};

export type Query = {
   __typename?: 'Query';
  getTrackable?: Maybe<Trackable>;
  getTrackables?: Maybe<AppCollection>;
  getRecipients: Array<Recipient>;
  me?: Maybe<User>;
};


export type QueryGetTrackableArgs = {
  did: Scalars['ID'];
};

export type Mutation = {
   __typename?: 'Mutation';
  login?: Maybe<User>;
  register?: Maybe<User>;
  logout?: Maybe<User>;
  createRecipient?: Maybe<Recipient>;
  createTrackable?: Maybe<CreateTrackablePayload>;
  addUpdate?: Maybe<AddUpdatePayload>;
  addCollaborator?: Maybe<AddCollaboratorPayload>;
  acceptJob?: Maybe<AcceptJobPayload>;
  pickupDonation?: Maybe<PickupPayload>;
  completeJob?: Maybe<CompleteJobPayload>;
};


export type MutationLoginArgs = {
  namespace: Scalars['String'];
  username: Scalars['String'];
  password: Scalars['String'];
};


export type MutationRegisterArgs = {
  namespace: Scalars['String'];
  username: Scalars['String'];
  password: Scalars['String'];
};


export type MutationLogoutArgs = {
  did?: Maybe<Scalars['String']>;
};


export type MutationCreateRecipientArgs = {
  name: Scalars['String'];
  password: Scalars['String'];
  address: AddressInput;
  instructions: Scalars['String'];
};


export type MutationCreateTrackableArgs = {
  input: CreateTrackableInput;
};


export type MutationAddUpdateArgs = {
  input: AddUpdateInput;
};


export type MutationAddCollaboratorArgs = {
  input: AddCollaboratorInput;
};


export type MutationAcceptJobArgs = {
  input: AcceptJobInput;
};


export type MutationPickupDonationArgs = {
  input: PickupInput;
};


export type MutationCompleteJobArgs = {
  input: CompleteJobInput;
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type StitchingResolver<TResult, TParent, TContext, TArgs> = {
  fragment: string;
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};

export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | StitchingResolver<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterator<TResult> | Promise<AsyncIterator<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type isTypeOfResolverFn<T = {}> = (obj: T, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  String: ResolverTypeWrapper<Scalars['String']>,
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>,
  JSON: ResolverTypeWrapper<Scalars['JSON']>,
  User: ResolverTypeWrapper<User>,
  ID: ResolverTypeWrapper<Scalars['ID']>,
  TrackableStatus: TrackableStatus,
  Recipient: ResolverTypeWrapper<Recipient>,
  Trackable: ResolverTypeWrapper<Trackable>,
  TrackableCollaboratorConnection: ResolverTypeWrapper<TrackableCollaboratorConnection>,
  TrackableUpdateConnection: ResolverTypeWrapper<TrackableUpdateConnection>,
  TrackableUpdate: ResolverTypeWrapper<TrackableUpdate>,
  MetadataEntry: ResolverTypeWrapper<MetadataEntry>,
  TrackableCollection: ResolverTypeWrapper<TrackableCollection>,
  Address: ResolverTypeWrapper<Address>,
  AppCollection: ResolverTypeWrapper<AppCollection>,
  CreateTrackableInput: CreateTrackableInput,
  AddressInput: AddressInput,
  MetadataEntryInput: MetadataEntryInput,
  AddUpdateInput: AddUpdateInput,
  CreateTrackablePayload: ResolverTypeWrapper<CreateTrackablePayload>,
  AddUpdatePayload: ResolverTypeWrapper<AddUpdatePayload>,
  AddCollaboratorPayload: ResolverTypeWrapper<AddCollaboratorPayload>,
  Int: ResolverTypeWrapper<Scalars['Int']>,
  AddCollaboratorInput: AddCollaboratorInput,
  AcceptJobInput: AcceptJobInput,
  AcceptJobPayload: ResolverTypeWrapper<AcceptJobPayload>,
  PickupInput: PickupInput,
  PickupPayload: ResolverTypeWrapper<PickupPayload>,
  CompleteJobPayload: ResolverTypeWrapper<CompleteJobPayload>,
  CompleteJobInput: CompleteJobInput,
  Query: ResolverTypeWrapper<{}>,
  Mutation: ResolverTypeWrapper<{}>,
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  String: Scalars['String'],
  Boolean: Scalars['Boolean'],
  JSON: Scalars['JSON'],
  User: User,
  ID: Scalars['ID'],
  TrackableStatus: TrackableStatus,
  Recipient: Recipient,
  Trackable: Trackable,
  TrackableCollaboratorConnection: TrackableCollaboratorConnection,
  TrackableUpdateConnection: TrackableUpdateConnection,
  TrackableUpdate: TrackableUpdate,
  MetadataEntry: MetadataEntry,
  TrackableCollection: TrackableCollection,
  Address: Address,
  AppCollection: AppCollection,
  CreateTrackableInput: CreateTrackableInput,
  AddressInput: AddressInput,
  MetadataEntryInput: MetadataEntryInput,
  AddUpdateInput: AddUpdateInput,
  CreateTrackablePayload: CreateTrackablePayload,
  AddUpdatePayload: AddUpdatePayload,
  AddCollaboratorPayload: AddCollaboratorPayload,
  Int: Scalars['Int'],
  AddCollaboratorInput: AddCollaboratorInput,
  AcceptJobInput: AcceptJobInput,
  AcceptJobPayload: AcceptJobPayload,
  PickupInput: PickupInput,
  PickupPayload: PickupPayload,
  CompleteJobPayload: CompleteJobPayload,
  CompleteJobInput: CompleteJobInput,
  Query: {},
  Mutation: {},
};

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON'
}

export type UserResolvers<ContextType = any, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  did?: Resolver<ResolversTypes['ID'], ParentType, ContextType>,
  username?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  namespace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  loggedIn?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>,
  collection?: Resolver<Maybe<ResolversTypes['TrackableCollection']>, ParentType, ContextType>,
  pendingDeliveries?: Resolver<Maybe<ResolversTypes['TrackableCollection']>, ParentType, ContextType>,
  completedDeliveries?: Resolver<Maybe<ResolversTypes['TrackableCollection']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type RecipientResolvers<ContextType = any, ParentType extends ResolversParentTypes['Recipient'] = ResolversParentTypes['Recipient']> = {
  did?: Resolver<ResolversTypes['ID'], ParentType, ContextType>,
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  address?: Resolver<Maybe<ResolversTypes['Address']>, ParentType, ContextType>,
  instructions?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type TrackableResolvers<ContextType = any, ParentType extends ResolversParentTypes['Trackable'] = ResolversParentTypes['Trackable']> = {
  did?: Resolver<ResolversTypes['ID'], ParentType, ContextType>,
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  image?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  updates?: Resolver<ResolversTypes['TrackableUpdateConnection'], ParentType, ContextType>,
  collaborators?: Resolver<Maybe<ResolversTypes['TrackableCollaboratorConnection']>, ParentType, ContextType>,
  status?: Resolver<Maybe<ResolversTypes['TrackableStatus']>, ParentType, ContextType>,
  driver?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>,
  metadata?: Resolver<Maybe<Array<ResolversTypes['MetadataEntry']>>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type TrackableCollaboratorConnectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['TrackableCollaboratorConnection'] = ResolversParentTypes['TrackableCollaboratorConnection']> = {
  edges?: Resolver<Maybe<Array<ResolversTypes['User']>>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type TrackableUpdateConnectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['TrackableUpdateConnection'] = ResolversParentTypes['TrackableUpdateConnection']> = {
  edges?: Resolver<Maybe<Array<ResolversTypes['TrackableUpdate']>>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type TrackableUpdateResolvers<ContextType = any, ParentType extends ResolversParentTypes['TrackableUpdate'] = ResolversParentTypes['TrackableUpdate']> = {
  did?: Resolver<ResolversTypes['ID'], ParentType, ContextType>,
  timestamp?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  metadata?: Resolver<Maybe<Array<ResolversTypes['MetadataEntry']>>, ParentType, ContextType>,
  userDid?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  userName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  recipientDid?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  recipientName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type MetadataEntryResolvers<ContextType = any, ParentType extends ResolversParentTypes['MetadataEntry'] = ResolversParentTypes['MetadataEntry']> = {
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  value?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type TrackableCollectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['TrackableCollection'] = ResolversParentTypes['TrackableCollection']> = {
  did?: Resolver<ResolversTypes['ID'], ParentType, ContextType>,
  trackables?: Resolver<Maybe<Array<ResolversTypes['Trackable']>>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type AddressResolvers<ContextType = any, ParentType extends ResolversParentTypes['Address'] = ResolversParentTypes['Address']> = {
  street?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  cityStateZip?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type AppCollectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['AppCollection'] = ResolversParentTypes['AppCollection']> = {
  did?: Resolver<ResolversTypes['ID'], ParentType, ContextType>,
  trackables?: Resolver<Maybe<Array<ResolversTypes['Trackable']>>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type CreateTrackablePayloadResolvers<ContextType = any, ParentType extends ResolversParentTypes['CreateTrackablePayload'] = ResolversParentTypes['CreateTrackablePayload']> = {
  collection?: Resolver<Maybe<ResolversTypes['TrackableCollection']>, ParentType, ContextType>,
  trackable?: Resolver<Maybe<ResolversTypes['Trackable']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type AddUpdatePayloadResolvers<ContextType = any, ParentType extends ResolversParentTypes['AddUpdatePayload'] = ResolversParentTypes['AddUpdatePayload']> = {
  update?: Resolver<ResolversTypes['TrackableUpdate'], ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type AddCollaboratorPayloadResolvers<ContextType = any, ParentType extends ResolversParentTypes['AddCollaboratorPayload'] = ResolversParentTypes['AddCollaboratorPayload']> = {
  collaborator?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>,
  code?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type AcceptJobPayloadResolvers<ContextType = any, ParentType extends ResolversParentTypes['AcceptJobPayload'] = ResolversParentTypes['AcceptJobPayload']> = {
  trackable?: Resolver<Maybe<ResolversTypes['Trackable']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type PickupPayloadResolvers<ContextType = any, ParentType extends ResolversParentTypes['PickupPayload'] = ResolversParentTypes['PickupPayload']> = {
  trackable?: Resolver<Maybe<ResolversTypes['Trackable']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type CompleteJobPayloadResolvers<ContextType = any, ParentType extends ResolversParentTypes['CompleteJobPayload'] = ResolversParentTypes['CompleteJobPayload']> = {
  trackable?: Resolver<Maybe<ResolversTypes['Trackable']>, ParentType, ContextType>,
  recipient?: Resolver<Maybe<ResolversTypes['Recipient']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  getTrackable?: Resolver<Maybe<ResolversTypes['Trackable']>, ParentType, ContextType, RequireFields<QueryGetTrackableArgs, 'did'>>,
  getTrackables?: Resolver<Maybe<ResolversTypes['AppCollection']>, ParentType, ContextType>,
  getRecipients?: Resolver<Array<ResolversTypes['Recipient']>, ParentType, ContextType>,
  me?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>,
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  login?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationLoginArgs, 'namespace' | 'username' | 'password'>>,
  register?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationRegisterArgs, 'namespace' | 'username' | 'password'>>,
  logout?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationLogoutArgs, never>>,
  createRecipient?: Resolver<Maybe<ResolversTypes['Recipient']>, ParentType, ContextType, RequireFields<MutationCreateRecipientArgs, 'name' | 'password' | 'address' | 'instructions'>>,
  createTrackable?: Resolver<Maybe<ResolversTypes['CreateTrackablePayload']>, ParentType, ContextType, RequireFields<MutationCreateTrackableArgs, 'input'>>,
  addUpdate?: Resolver<Maybe<ResolversTypes['AddUpdatePayload']>, ParentType, ContextType, RequireFields<MutationAddUpdateArgs, 'input'>>,
  addCollaborator?: Resolver<Maybe<ResolversTypes['AddCollaboratorPayload']>, ParentType, ContextType, RequireFields<MutationAddCollaboratorArgs, 'input'>>,
  acceptJob?: Resolver<Maybe<ResolversTypes['AcceptJobPayload']>, ParentType, ContextType, RequireFields<MutationAcceptJobArgs, 'input'>>,
  pickupDonation?: Resolver<Maybe<ResolversTypes['PickupPayload']>, ParentType, ContextType, RequireFields<MutationPickupDonationArgs, 'input'>>,
  completeJob?: Resolver<Maybe<ResolversTypes['CompleteJobPayload']>, ParentType, ContextType, RequireFields<MutationCompleteJobArgs, 'input'>>,
};

export type Resolvers<ContextType = any> = {
  JSON?: GraphQLScalarType,
  User?: UserResolvers<ContextType>,
  Recipient?: RecipientResolvers<ContextType>,
  Trackable?: TrackableResolvers<ContextType>,
  TrackableCollaboratorConnection?: TrackableCollaboratorConnectionResolvers<ContextType>,
  TrackableUpdateConnection?: TrackableUpdateConnectionResolvers<ContextType>,
  TrackableUpdate?: TrackableUpdateResolvers<ContextType>,
  MetadataEntry?: MetadataEntryResolvers<ContextType>,
  TrackableCollection?: TrackableCollectionResolvers<ContextType>,
  Address?: AddressResolvers<ContextType>,
  AppCollection?: AppCollectionResolvers<ContextType>,
  CreateTrackablePayload?: CreateTrackablePayloadResolvers<ContextType>,
  AddUpdatePayload?: AddUpdatePayloadResolvers<ContextType>,
  AddCollaboratorPayload?: AddCollaboratorPayloadResolvers<ContextType>,
  AcceptJobPayload?: AcceptJobPayloadResolvers<ContextType>,
  PickupPayload?: PickupPayloadResolvers<ContextType>,
  CompleteJobPayload?: CompleteJobPayloadResolvers<ContextType>,
  Query?: QueryResolvers<ContextType>,
  Mutation?: MutationResolvers<ContextType>,
};


/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = any> = Resolvers<ContextType>;


