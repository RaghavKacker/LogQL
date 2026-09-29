%{
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <string>
#include <vector>
#include "ast.hpp"
#include "token.hpp"
#include "parser.tab.hpp"

extern std::vector<logql::Token> g_scannedTokens;

int yycolumn = 1;

#define YY_USER_ACTION \
    yylloc_col = yycolumn; \
    yycolumn += yyleng;

static int yylloc_col = 1;

void recordToken(logql::TokenType type, const char* text) {
    g_scannedTokens.push_back({type, text, yylineno, yylloc_col});
}

char* unquote(const char* s, int len) {
    char* buf = (char*)malloc(len - 1);
    memcpy(buf, s + 1, len - 2);
    buf[len - 2] = '\0';
    return buf;
}

static YY_BUFFER_STATE g_current_buffer = nullptr;

void logql_scan_string(const char* str) {
    g_current_buffer = yy_scan_string(str);
}

void logql_delete_buffer() {
    if (g_current_buffer) {
        yy_delete_buffer(g_current_buffer);
        g_current_buffer = nullptr;
    }
}
%}

%option noyywrap
%option yylineno
%option case-insensitive
%option nounput
%option noinput

DIGIT       [0-9]
INT_NUM     {DIGIT}+
FLOAT_NUM   {DIGIT}+\.{DIGIT}+
IDENT       [a-zA-Z_][a-zA-Z0-9_]*
STRING_SQ   \'([^\'\\]|\\.)*\'
STRING_DQ   \"([^\"\\]|\\.)*\"
WS          [ \t\r]+

%%

\n              { yycolumn = 1; }
{WS}            { /* ignore whitespace */ }

"--"[^\n]*      { /* single-line comment */ }

"SELECT"        { recordToken(logql::TokenType::KEYWORD_SELECT, yytext); yylval.str_val = strdup(yytext); return KEYWORD_SELECT; }
"FROM"          { recordToken(logql::TokenType::KEYWORD_FROM, yytext); yylval.str_val = strdup(yytext); return KEYWORD_FROM; }
"WHERE"         { recordToken(logql::TokenType::KEYWORD_WHERE, yytext); yylval.str_val = strdup(yytext); return KEYWORD_WHERE; }
"GROUP"         { recordToken(logql::TokenType::KEYWORD_GROUP, yytext); yylval.str_val = strdup(yytext); return KEYWORD_GROUP; }
"BY"            { recordToken(logql::TokenType::KEYWORD_BY, yytext); yylval.str_val = strdup(yytext); return KEYWORD_BY; }
"ORDER"         { recordToken(logql::TokenType::KEYWORD_ORDER, yytext); yylval.str_val = strdup(yytext); return KEYWORD_ORDER; }
"ASC"           { recordToken(logql::TokenType::KEYWORD_ASC, yytext); yylval.str_val = strdup(yytext); return KEYWORD_ASC; }
"DESC"          { recordToken(logql::TokenType::KEYWORD_DESC, yytext); yylval.str_val = strdup(yytext); return KEYWORD_DESC; }
"LIMIT"         { recordToken(logql::TokenType::KEYWORD_LIMIT, yytext); yylval.str_val = strdup(yytext); return KEYWORD_LIMIT; }
"DISTINCT"      { recordToken(logql::TokenType::KEYWORD_DISTINCT, yytext); yylval.str_val = strdup(yytext); return KEYWORD_DISTINCT; }
"AS"            { recordToken(logql::TokenType::KEYWORD_AS, yytext); yylval.str_val = strdup(yytext); return KEYWORD_AS; }

"AND"           { recordToken(logql::TokenType::KEYWORD_AND, yytext); yylval.str_val = strdup(yytext); return KEYWORD_AND; }
"OR"            { recordToken(logql::TokenType::KEYWORD_OR, yytext); yylval.str_val = strdup(yytext); return KEYWORD_OR; }
"NOT"           { recordToken(logql::TokenType::KEYWORD_NOT, yytext); yylval.str_val = strdup(yytext); return KEYWORD_NOT; }

"COUNT"         { recordToken(logql::TokenType::KEYWORD_COUNT, yytext); yylval.str_val = strdup(yytext); return KEYWORD_COUNT; }
"MIN"           { recordToken(logql::TokenType::KEYWORD_MIN, yytext); yylval.str_val = strdup(yytext); return KEYWORD_MIN; }
"MAX"           { recordToken(logql::TokenType::KEYWORD_MAX, yytext); yylval.str_val = strdup(yytext); return KEYWORD_MAX; }
"AVG"           { recordToken(logql::TokenType::KEYWORD_AVG, yytext); yylval.str_val = strdup(yytext); return KEYWORD_AVG; }
"SUM"           { recordToken(logql::TokenType::KEYWORD_SUM, yytext); yylval.str_val = strdup(yytext); return KEYWORD_SUM; }

"TRUE"          { recordToken(logql::TokenType::KEYWORD_TRUE, yytext); yylval.bool_val = true; return KEYWORD_TRUE; }
"FALSE"         { recordToken(logql::TokenType::KEYWORD_FALSE, yytext); yylval.bool_val = false; return KEYWORD_FALSE; }
"NULL"          { recordToken(logql::TokenType::KEYWORD_NULL, yytext); yylval.str_val = strdup(yytext); return KEYWORD_NULL; }

">="            { recordToken(logql::TokenType::OP_GE, yytext); return OP_GE; }
"<="            { recordToken(logql::TokenType::OP_LE, yytext); return OP_LE; }
"!="            { recordToken(logql::TokenType::OP_NEQ, yytext); return OP_NEQ; }
"<>"            { recordToken(logql::TokenType::OP_NEQ, yytext); return OP_NEQ; }
"="             { recordToken(logql::TokenType::OP_EQ, yytext); return OP_EQ; }
"=="            { recordToken(logql::TokenType::OP_EQ, yytext); return OP_EQ; }
">"             { recordToken(logql::TokenType::OP_GT, yytext); return OP_GT; }
"<"             { recordToken(logql::TokenType::OP_LT, yytext); return OP_LT; }

"+"             { recordToken(logql::TokenType::OP_PLUS, yytext); return OP_PLUS; }
"-"             { recordToken(logql::TokenType::OP_MINUS, yytext); return OP_MINUS; }
"*"             { recordToken(logql::TokenType::OP_STAR, yytext); return OP_STAR; }
"/"             { recordToken(logql::TokenType::OP_SLASH, yytext); return OP_SLASH; }

"("             { recordToken(logql::TokenType::LPAREN, yytext); return LPAREN; }
")"             { recordToken(logql::TokenType::RPAREN, yytext); return RPAREN; }
","             { recordToken(logql::TokenType::COMMA, yytext); return COMMA; }
";"             { recordToken(logql::TokenType::SEMICOLON, yytext); return SEMICOLON; }

{INT_NUM}       {
                    recordToken(logql::TokenType::INT_LITERAL, yytext);
                    yylval.int_val = std::atoll(yytext);
                    return INT_LITERAL;
                }

{FLOAT_NUM}     {
                    recordToken(logql::TokenType::FLOAT_LITERAL, yytext);
                    yylval.float_val = std::atof(yytext);
                    return FLOAT_LITERAL;
                }

{STRING_SQ}     {
                    char* val = unquote(yytext, yyleng);
                    recordToken(logql::TokenType::STRING_LITERAL, val);
                    yylval.str_val = val;
                    return STRING_LITERAL;
                }

{STRING_DQ}     {
                    char* val = unquote(yytext, yyleng);
                    recordToken(logql::TokenType::STRING_LITERAL, val);
                    yylval.str_val = val;
                    return STRING_LITERAL;
                }

{IDENT}         {
                    recordToken(logql::TokenType::IDENTIFIER, yytext);
                    yylval.str_val = strdup(yytext);
                    return IDENTIFIER;
                }

.               {
                    recordToken(logql::TokenType::LEXICAL_ERROR, yytext);
                    return yytext[0];
                }

%%
