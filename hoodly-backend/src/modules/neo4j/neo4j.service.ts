import { Injectable, OnApplicationShutdown, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver, Session } from 'neo4j-driver';

@Injectable()
export class Neo4jService implements OnApplicationShutdown {
  private readonly driver: Driver;
  private readonly database: string;
  private readonly logger = new Logger(Neo4jService.name);

  constructor(config: ConfigService) {
    this.database = config.getOrThrow<string>('NEO4J_DATABASE');
    this.driver = neo4j.driver(
      config.getOrThrow<string>('NEO4J_URI'),
      neo4j.auth.basic(
        config.getOrThrow<string>('NEO4J_USERNAME'),
        config.getOrThrow<string>('NEO4J_PASSWORD'),
      ),
    );
  }

  getSession(): Session {
    return this.driver.session({ database: this.database });
  }

  async run(cypher: string, params: Record<string, any> = {}) {
    const session = this.getSession();
    try {
      return await session.run(cypher, params);
    } finally {
      await session.close();
    }
  }

  async verifyConnectivity() {
    try {
      await this.driver.verifyConnectivity();
      this.logger.log('Neo4j connected');
    } catch (err) {
      this.logger.error('Neo4j connection failed', err);
    }
  }

  syncInteret(userId: string, eventId: string, eventCategorie: string) {
    this.run(
      `MERGE (u:User {id: $userId})
       MERGE (e:Event {id: $eventId})
         ON CREATE SET e.categorie = $eventCategorie
       MERGE (u)-[:INTERESSE]->(e)`,
      { userId, eventId, eventCategorie },
    ).catch((err) => this.logger.warn('Neo4j syncInteret failed', err));
  }

  removeInteret(userId: string, eventId: string) {
    this.run(
      `MATCH (u:User {id: $userId})-[r:INTERESSE]->(e:Event {id: $eventId})
       DELETE r`,
      { userId, eventId },
    ).catch((err) => this.logger.warn('Neo4j removeInteret failed', err));
  }

  syncParticipation(userId: string, eventId: string, eventCategorie: string) {
    this.run(
      `MERGE (u:User {id: $userId})
       MERGE (e:Event {id: $eventId})
         ON CREATE SET e.categorie = $eventCategorie
       MERGE (u)-[:PARTICIPE]->(e)`,
      { userId, eventId, eventCategorie },
    ).catch((err) => this.logger.warn('Neo4j syncParticipation failed', err));
  }

  removeParticipation(userId: string, eventId: string) {
    this.run(
      `MATCH (u:User {id: $userId})-[r:PARTICIPE]->(e:Event {id: $eventId})
       DELETE r`,
      { userId, eventId },
    ).catch((err) => this.logger.warn('Neo4j removeParticipation failed', err));
  }

  async getEventRecommendations(userId: string): Promise<string[]> {
    const result = await this.run(
      `MATCH (me:User {id: $userId})-[:INTERESSE|PARTICIPE]->(e:Event)<-[:INTERESSE|PARTICIPE]-(other:User)
       MATCH (other)-[:INTERESSE|PARTICIPE]->(suggestion:Event)
       WHERE NOT (me)-[:INTERESSE|PARTICIPE]->(suggestion)
         AND suggestion.id <> $userId
       RETURN suggestion.id AS eventId, count(*) AS score
       ORDER BY score DESC
       LIMIT 10`,
      { userId },
    );
    return result.records.map((r) => r.get('eventId') as string);
  }

  async onApplicationShutdown() {
    await this.driver.close();
  }
}
