import express from 'express';
import bodyParser from 'body-parser';
import chai from 'chai';
import chaiHttp from 'chai-http';
import { MongoMemoryServer } from 'mongodb-memory-server';
import MongoConnection from '../../db';
import { ChatsSchema } from '../../db/schemas/chats-schema';
import { MockSecurityMiddleware, requestHeaders, testChatsData } from '../../lib/utils/test-utils';
import { SecurityMiddleware } from 'react';
import fetchMock from 'fetch-mock';
import MercuryIntegration from '../../lib/files/service';

import { ChatsRoutes } from './routes';

chai.use(chaiHttp);

const expect = chai.expect;

describe('ChatsRoutes', async () => {
  let app: express.Express;

  let mongoDbTestInstance: MongoConnection;
  let server: MongoMemoryServer;
  const mockedSecurity = new MockSecurityMiddleware();

  const mercuryUrl = MercuryIntegration.getMercuryUrl('us');
  const fetchPostMock = (url: string, status: number, body: object) =>
    fetchMock.post(url, { status, body: JSON.stringify(body) });
  const fetchDeleteMock = (url: string, status: number, body: object) =>
    fetchMock.delete(url, { status, body: JSON.stringify(body) });

  before(async () => {
    // start server first
    server = await MongoMemoryServer.create();
    server.start();

    // then connect using the MongoConnection class
    const dbUri = await server.getUri();
    mongoDbTestInstance = new MongoConnection(dbUri);
    await mongoDbTestInstance
      .getDbCollection(ChatsSchema.COLLECTION_NAME, ChatsSchema.SCHEMA)
      .collection.insertMany(testChatsData);
  });

  beforeEach(async () => {
    app = express();
    app.use(bodyParser.json());
    app.use(ChatsRoutes.routes(mongoDbTestInstance, mockedSecurity as SecurityMiddleware));
    fetchMock.reset();
  });

  after(async () => {
    await mongoDbTestInstance.getDbCollection(ChatsSchema.COLLECTION_NAME, ChatsSchema.SCHEMA).collection.drop();
    await server.stop();
    // have to close connection after server is stopped
    await mongoDbTestInstance.disconnectFromDb();
  });

  describe(`POST ${ChatsRoutes.PATHS.CHATS}`, () => {
    it('should insert new chat into db', () => {
      fetchPostMock('end:/new_chat/chat', 200, {
        id: 'e20874fe-a9b0-45fb-9b4d-c85764bdd6f2',
        name: 'New Chat',
        created_at: '2024-06-17T15:56:09.136445+00:00'
      });
      fetchPostMock(`begin:${mercuryUrl}`, 201, { whatever: 'asdad' });
      return chai
        .request(app)
        .post('/chats')
        .set(requestHeaders[0], requestHeaders[1])
        .then((res) => {
          expect(res).to.have.status(201);
        });
    });

    it('should fail to insert new chat into db (Missing treeItemId)', () => {
      fetchPostMock('end:/new_chat/chat', 200, {
        name: 'New Chat',
        created_at: '2024-06-17T15:56:09.136445+00:00'
      });
      fetchPostMock(`begin:${mercuryUrl}`, 201, { whatever: 'asdad' });

      return chai
        .request(app)
        .post('/chats')
        .set(requestHeaders[0], requestHeaders[1])
        .then((res) => {
          expect(res).to.have.status(400);
          expect(res.body.code).to.equal('missing_property');
        });
    });

    it('should fail to insert new chat into db (Duplicate chat)', () => {
      fetchPostMock('end:/new_chat/chat', 200, {
        id: 'e20874fe-a9b0-45fb-9b4d-c85764bdd6f2',
        name: 'New Chat',
        created_at: '2024-06-17T15:56:09.136445+00:00'
      });
      fetchPostMock(`begin:${mercuryUrl}`, 201, { whatever: 'asdad' });
      fetchDeleteMock(`begin:${mercuryUrl}`, 200, { whatever: 'asdad' });
      return chai
        .request(app)
        .post('/chats')
        .set(requestHeaders[0], requestHeaders[1])
        .then((res) => {
          expect(res).to.have.status(409);
          expect(res.body.code).to.equal('duplicate_entry');
        });
    });

    it('should fail if no auth header is sent', () => {
      fetchPostMock('end:/new_chat/chat', 200, {
        id: 'e20874fe-a9b0-45fb-9b4d-c85764bdd6f2',
        name: 'New Chat',
        created_at: '2024-06-17T15:56:09.136445+00:00'
      });

      return chai
        .request(app)
        .post('/chats')
        .then((res) => {
          expect(res).to.have.status(401);
          expect(res.body.code).to.equal('no_authorized_user');
        });
    });
  });

  describe(`PATCH ${ChatsRoutes.PATHS.CHATS}`, () => {
    it('should update chat name of chat in db', () => {
      return chai
        .request(app)
        .patch('/chats')
        .set(requestHeaders[0], requestHeaders[1])
        .send({ id: testChatsData[0].treeItemId, updates: { name: 'New Chat Name' } })
        .then((res) => {
          expect(res).to.have.status(200);
        });
    });
    it('should fail to update chat in db (Missing treeItemId)', () => {
      return chai
        .request(app)
        .patch('/chats')
        .set(requestHeaders[0], requestHeaders[1])
        .then((res) => {
          expect(res).to.have.status(400);
          expect(res.body.code).to.equal('missing_property');
        });
    });
    it('should fail to update chat in db (No updates)', () => {
      return chai
        .request(app)
        .patch('/chats')
        .set(requestHeaders[0], requestHeaders[1])
        .send({ id: testChatsData[0].treeItemId })
        .then((res) => {
          expect(res).to.have.status(400);
          expect(res.body.code).to.equal('missing_property');
        });
    });

    it('should fail to update chat in db (Chat not found)', () => {
      return chai
        .request(app)
        .patch('/chats')
        .set(requestHeaders[0], requestHeaders[1])
        .send({ id: 'test-chat-uuid-number2', updates: { name: 'New Chat Name' } })
        .then((res) => {
          expect(res).to.have.status(404);
          expect(res.body.code).to.equal('not_found');
        });
    });

    it('should fail to update if no auth header', () => {
      return chai
        .request(app)
        .patch('/chats')
        .send({ id: 'test-chat-uuid-number2', updates: { name: 'New Chat Name' } })
        .then((res) => {
          expect(res).to.have.status(401);
          expect(res.body.code).to.equal('no_authorized_user');
        });
    });
  });

  describe(`DELETE ${ChatsRoutes.PATHS.CHATS}`, () => {
    it('should fail to delete chat in db (Missing treeItemId)', () => {
      return chai
        .request(app)
        .delete('/chats')
        .set(requestHeaders[0], requestHeaders[1])
        .then((res) => {
          expect(res).to.have.status(400);
          expect(res.body.code).to.equal('missing_property');
        });
    });
    it('should fail to delete chat in db (Chat not found)', () => {
      return chai
        .request(app)
        .delete('/chats')
        .set(requestHeaders[0], requestHeaders[1])
        .send({ id: 'test-chat-uuid-number2' })
        .then((res) => {
          expect(res).to.have.status(404);
          expect(res.body.code).to.equal('not_found');
        });
    });
    it('should delete chat from db', () => {
      return chai
        .request(app)
        .delete('/chats')
        .set(requestHeaders[0], requestHeaders[1])
        .send({ id: testChatsData[0].treeItemId })
        .then((res) => {
          expect(res).to.have.status(200);
        });
    });

    it('should fail to delete chat from db if no auth header', () => {
      return chai
        .request(app)
        .delete('/chats')
        .send({ id: testChatsData[0].treeItemId })
        .then((res) => {
          expect(res).to.have.status(401);
          expect(res.body.code).to.equal('no_authorized_user');
        });
    });
  });

  describe(`POST ${ChatsRoutes.PATHS.GENERATE_CHAT_NAME}`, () => {
    it('should call to generate name for chat', () => {
      fetchPostMock('end:/generate-name', 200, {
        name: 'New Generated Chat Name'
      });

      return chai
        .request(app)
        .post(ChatsRoutes.PATHS.GENERATE_CHAT_NAME)
        .set(requestHeaders[0], requestHeaders[1])
        .then((res) => {
          expect(res).to.have.status(201);
          console.log(res.body);
          expect(res.body.newName).to.equal('New Generated Chat Name');
        });
    });

    it('should fail to generate new name', () => {
      fetchPostMock('end:/generate-name', 500, {});

      return chai
        .request(app)
        .post(ChatsRoutes.PATHS.GENERATE_CHAT_NAME)
        .set(requestHeaders[0], requestHeaders[1])
        .then((res) => {
          expect(res).to.have.status(500);
          expect(res.body.code).to.equal('chat_service_error');
        });
    });

    it('should fail generate name if no auth header is sent', () => {
      fetchPostMock('end:/generate-name', 200, {
        name: 'New Generated Chat Name'
      });

      return chai
        .request(app)
        .post(ChatsRoutes.PATHS.GENERATE_CHAT_NAME)
        .then((res) => {
          expect(res).to.have.status(401);
          expect(res.body.code).to.equal('no_authorized_user');
        });
    });
  });
});
