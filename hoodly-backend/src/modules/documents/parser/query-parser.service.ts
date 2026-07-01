import { Injectable, BadRequestException } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import jison = require('jison');

const JISON_GRAMMAR = `
%lex
%%

\\s+                   /* ignorer les espaces */
"FIND"                return 'FIND'
"WHERE"               return 'WHERE'
"AND"                 return 'AND'
"="                   return '='
[0-9]+                return 'NUMBER'
\\"([^\\\\\\"]|\\\\.)*\\" return 'STRING'
\\'([^\\\\\\']|\\\\.)*\\' return 'STRING'
[a-zA-Z_][a-zA-Z0-9_]* return 'IDENTIFIER'
<<EOF>>               return 'EOF'

/lex

%start expressions

%%

expressions
    : query EOF
        { return $1; }
    ;

query
    : FIND WHERE conditions
        { $$ = $3; }
    | FIND
        { $$ = {}; }
    ;

conditions
    : condition AND conditions
        { $$ = { ...$1, ...$3 }; }
    | condition
        { $$ = $1; }
    ;

condition
    : IDENTIFIER '=' value
        {
            var obj = {};
            obj[$1] = $3;
            $$ = obj;
        }
    ;

value
    : STRING
        { $$ = $1.slice(1, -1); }
    | NUMBER
        { $$ = Number($1); }
    ;
`;

@Injectable()
export class QueryParserService {
  private parser: any;

  constructor() {
    try {
      this.parser = new jison.Parser(JISON_GRAMMAR);
    } catch (err: any) {
      console.error("Erreur d'initialisation du parseur Jison:", err);
    }
  }

  parse(queryText: string): Record<string, any> {
    if (!this.parser) {
      throw new Error("Le parseur syntaxique n'a pas été initialisé.");
    }
    if (!queryText || typeof queryText !== 'string') {
      throw new BadRequestException(
        "Le paramètre 'query' est requis et doit être une chaîne de caractères non vide.",
      );
    }
    try {
      const normalized = queryText.trim();
      return this.parser.parse(normalized);
    } catch (err: any) {
      throw new BadRequestException(
        `Erreur de syntaxe dans la requête : ${err.message}`,
      );
    }
  }
}
