import { GraphQLResolveInfo } from 'graphql';
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
};

export type User = {
   __typename?: 'User';
  did: Scalars['ID'];
  username?: Maybe<Scalars['String']>;
  namespace?: Maybe<Scalars['String']>;
  loggedIn?: Maybe<Scalars['Boolean']>;
  collection?: Maybe<TrackableCollection>;
};

export type Trackable = {
   __typename?: 'Trackable';
  did: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
  image?: Maybe<Scalars['String']>;
  updates?: Maybe<TrackableUpdateConnection>;
};

export type TrackableUpdateConnection = {
   __typename?: 'TrackableUpdateConnection';
  did: Scalars['ID'];
  edges?: Maybe<Array<Maybe<TrackableUpdate>>>;
};

export type TrackableUpdate = {
   __typename?: 'TrackableUpdate';
  id: Scalars['ID'];
  timestamp?: Maybe<Scalars['String']>;
  message?: Maybe<Scalars['String']>;
  metadata?: Maybe<Array<Maybe<MetadataEntry>>>;
  userDid: Scalars['String'];
  userName: Scalars['String'];
};

export type MetadataEntry = {
   __typename?: 'MetadataEntry';
  key: Scalars['String'];
  value?: Maybe<Scalars['String']>;
};

export type TrackableCollection = {
   __typename?: 'TrackableCollection';
  did: Scalars['ID'];
  trackables?: Maybe<Array<Trackable>>;
};

export type Query = {
   __typename?: 'Query';
  me?: Maybe<User>;
};

export type CreateTrackableInput = {
  name: Scalars['String'];
  image?: Maybe<Scalars['String']>;
};

export type CreateTrackablePayload = {
   __typename?: 'CreateTrackablePayload';
  collection?: Maybe<TrackableCollection>;
  trackable?: Maybe<Trackable>;
};

export type Mutation = {
   __typename?: 'Mutation';
  login?: Maybe<User>;
  register?: Maybe<User>;
  logout?: Maybe<User>;
  createTrackable?: Maybe<CreateTrackablePayload>;
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


export type MutationCreateTrackableArgs = {
  input: CreateTrackableInput;
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
  User: ResolverTypeWrapper<User>,
  ID: ResolverTypeWrapper<Scalars['ID']>,
  Trackable: ResolverTypeWrapper<Trackable>,
  TrackableUpdateConnection: ResolverTypeWrapper<TrackableUpdateConnection>,
  TrackableUpdate: ResolverTypeWrapper<TrackableUpdate>,
  MetadataEntry: ResolverTypeWrapper<MetadataEntry>,
  TrackableCollection: ResolverTypeWrapper<TrackableCollection>,
  Query: ResolverTypeWrapper<{}>,
  CreateTrackableInput: CreateTrackableInput,
  CreateTrackablePayload: ResolverTypeWrapper<CreateTrackablePayload>,
  Mutation: ResolverTypeWrapper<{}>,
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  String: Scalars['String'],
  Boolean: Scalars['Boolean'],
  User: User,
  ID: Scalars['ID'],
  Trackable: Trackable,
  TrackableUpdateConnection: TrackableUpdateConnection,
  TrackableUpdate: TrackableUpdate,
  MetadataEntry: MetadataEntry,
  TrackableCollection: TrackableCollection,
  Query: {},
  CreateTrackableInput: CreateTrackableInput,
  CreateTrackablePayload: CreateTrackablePayload,
  Mutation: {},
};

export type UserResolvers<ContextType = any, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  did?: Resolver<ResolversTypes['ID'], ParentType, ContextType>,
  username?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  namespace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  loggedIn?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>,
  collection?: Resolver<Maybe<ResolversTypes['TrackableCollection']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type TrackableResolvers<ContextType = any, ParentType extends ResolversParentTypes['Trackable'] = ResolversParentTypes['Trackable']> = {
  did?: Resolver<ResolversTypes['ID'], ParentType, ContextType>,
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  image?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  updates?: Resolver<Maybe<ResolversTypes['TrackableUpdateConnection']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type TrackableUpdateConnectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['TrackableUpdateConnection'] = ResolversParentTypes['TrackableUpdateConnection']> = {
  did?: Resolver<ResolversTypes['ID'], ParentType, ContextType>,
  edges?: Resolver<Maybe<Array<Maybe<ResolversTypes['TrackableUpdate']>>>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type TrackableUpdateResolvers<ContextType = any, ParentType extends ResolversParentTypes['TrackableUpdate'] = ResolversParentTypes['TrackableUpdate']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>,
  timestamp?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  metadata?: Resolver<Maybe<Array<Maybe<ResolversTypes['MetadataEntry']>>>, ParentType, ContextType>,
  userDid?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  userName?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type MetadataEntryResolvers<ContextType = any, ParentType extends ResolversParentTypes['MetadataEntry'] = ResolversParentTypes['MetadataEntry']> = {
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  value?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type TrackableCollectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['TrackableCollection'] = ResolversParentTypes['TrackableCollection']> = {
  did?: Resolver<ResolversTypes['ID'], ParentType, ContextType>,
  trackables?: Resolver<Maybe<Array<ResolversTypes['Trackable']>>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  me?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>,
};

export type CreateTrackablePayloadResolvers<ContextType = any, ParentType extends ResolversParentTypes['CreateTrackablePayload'] = ResolversParentTypes['CreateTrackablePayload']> = {
  collection?: Resolver<Maybe<ResolversTypes['TrackableCollection']>, ParentType, ContextType>,
  trackable?: Resolver<Maybe<ResolversTypes['Trackable']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  login?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationLoginArgs, 'namespace' | 'username' | 'password'>>,
  register?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationRegisterArgs, 'namespace' | 'username' | 'password'>>,
  logout?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationLogoutArgs, never>>,
  createTrackable?: Resolver<Maybe<ResolversTypes['CreateTrackablePayload']>, ParentType, ContextType, RequireFields<MutationCreateTrackableArgs, 'input'>>,
};

export type Resolvers<ContextType = any> = {
  User?: UserResolvers<ContextType>,
  Trackable?: TrackableResolvers<ContextType>,
  TrackableUpdateConnection?: TrackableUpdateConnectionResolvers<ContextType>,
  TrackableUpdate?: TrackableUpdateResolvers<ContextType>,
  MetadataEntry?: MetadataEntryResolvers<ContextType>,
  TrackableCollection?: TrackableCollectionResolvers<ContextType>,
  Query?: QueryResolvers<ContextType>,
  CreateTrackablePayload?: CreateTrackablePayloadResolvers<ContextType>,
  Mutation?: MutationResolvers<ContextType>,
};


/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
*/
export type IResolvers<ContextType = any> = Resolvers<ContextType>;


