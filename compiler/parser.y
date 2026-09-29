%{
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <string>
#include <vector>
#include <memory>
#include "ast.hpp"
#include "token.hpp"

// Forward declarations
extern int yylex();
extern int yylineno;
extern int yycolumn;
extern FILE* yyin;

void yyerror(const char* s);

// Global parsing results
logql::QueryNode* g_parsedQuery = nullptr;
std::string g_parseError = "";
int g_errorLine = 0;
int g_errorCol = 0;
std::vector<logql::Token> g_scannedTokens;

%}

%code requires {
#include <string>
#include <vector>
#include <memory>
#include "ast.hpp"
#include "token.hpp"
}

%union {
    int64_t int_val;
    double float_val;
    char* str_val;
    bool bool_val;
    logql::ASTNode* node;
    logql::QueryNode* query_node;
    logql::SelectListNode* select_list_node;
    logql::SelectItemNode* select_item_node;
    logql::ExprNode* expr_node;
    std::vector<std::string>* str_list;
    std::vector<logql::OrderByItem>* order_list;
}

/* Terminals / Tokens */
%token <str_val> KEYWORD_SELECT KEYWORD_FROM KEYWORD_WHERE KEYWORD_GROUP KEYWORD_BY
%token <str_val> KEYWORD_ORDER KEYWORD_ASC KEYWORD_DESC KEYWORD_LIMIT KEYWORD_DISTINCT KEYWORD_AS
%token <str_val> KEYWORD_AND KEYWORD_OR KEYWORD_NOT
%token <str_val> KEYWORD_COUNT KEYWORD_MIN KEYWORD_MAX KEYWORD_AVG KEYWORD_SUM
%token <str_val> KEYWORD_TRUE KEYWORD_FALSE KEYWORD_NULL

%token <str_val> IDENTIFIER
%token <int_val> INT_LITERAL
%token <float_val> FLOAT_LITERAL
%token <str_val> STRING_LITERAL

%token OP_EQ OP_NEQ OP_LT OP_GT OP_LE OP_GE
%token OP_PLUS OP_MINUS OP_STAR OP_SLASH
%token LPAREN RPAREN COMMA SEMICOLON

/* Operator Precedence and Associativity */
%left KEYWORD_OR
%left KEYWORD_AND
%right KEYWORD_NOT
%nonassoc OP_EQ OP_NEQ OP_LT OP_GT OP_LE OP_GE
%left OP_PLUS OP_MINUS
%left OP_STAR OP_SLASH

/* Non-terminal types */
%type <query_node> Query
%type <select_list_node> SelectList SelectItems
%type <select_item_node> SelectItem
%type <str_val> TableRef
%type <expr_node> WhereClause Expression Conjunction Inversion Predicate PrimaryExpr Term Factor FunctionCall Literal
%type <str_list> GroupByClause IdentifierList
%type <order_list> OrderByClause OrderItemList
%type <int_val> LimitClause

%start Query

%%

Query:
    KEYWORD_SELECT SelectList KEYWORD_FROM TableRef WhereClause GroupByClause OrderByClause LimitClause OptSemicolon
    {
        auto q = new logql::QueryNode();
        q->select.reset($2);
        q->from = std::make_unique<logql::FromNode>($4);
        free($4);

        if ($5) {
            q->where = std::make_unique<logql::WhereNode>(std::unique_ptr<logql::ExprNode>($5));
        }
        if ($6) {
            q->groupBy = std::make_unique<logql::GroupByNode>(*$6);
            delete $6;
        }
        if ($7) {
            auto ob = std::make_unique<logql::OrderByNode>();
            ob->items = std::move(*$7);
            delete $7;
            q->orderBy = std::move(ob);
        }
        if ($8 >= 0) {
            q->limit = std::make_unique<logql::LimitNode>($8);
        }
        $$ = q;
        g_parsedQuery = q;
    }
    ;

OptSemicolon:
    /* empty */
    | SEMICOLON
    ;

SelectList:
    OP_STAR
    {
        auto sl = new logql::SelectListNode(false);
        sl->isStar = true;
        $$ = sl;
    }
    | KEYWORD_DISTINCT OP_STAR
    {
        auto sl = new logql::SelectListNode(true);
        sl->isStar = true;
        $$ = sl;
    }
    | SelectItems
    {
        $$ = $1;
    }
    | KEYWORD_DISTINCT SelectItems
    {
        $2->distinct = true;
        $$ = $2;
    }
    ;

SelectItems:
    SelectItem
    {
        auto sl = new logql::SelectListNode(false);
        sl->items.push_back(std::unique_ptr<logql::SelectItemNode>($1));
        $$ = sl;
    }
    | SelectItems COMMA SelectItem
    {
        $1->items.push_back(std::unique_ptr<logql::SelectItemNode>($3));
        $$ = $1;
    }
    ;

SelectItem:
    FunctionCall
    {
        $$ = new logql::SelectItemNode(std::unique_ptr<logql::ExprNode>($1));
    }
    | FunctionCall KEYWORD_AS IDENTIFIER
    {
        $$ = new logql::SelectItemNode(std::unique_ptr<logql::ExprNode>($1), $3);
        free($3);
    }
    | FunctionCall IDENTIFIER
    {
        $$ = new logql::SelectItemNode(std::unique_ptr<logql::ExprNode>($1), $2);
        free($2);
    }
    | IDENTIFIER
    {
        $$ = new logql::SelectItemNode(std::make_unique<logql::IdentifierNode>($1));
        free($1);
    }
    | IDENTIFIER KEYWORD_AS IDENTIFIER
    {
        $$ = new logql::SelectItemNode(std::make_unique<logql::IdentifierNode>($1), $3);
        free($1);
        free($3);
    }
    | IDENTIFIER IDENTIFIER
    {
        $$ = new logql::SelectItemNode(std::make_unique<logql::IdentifierNode>($1), $2);
        free($1);
        free($2);
    }
    ;

TableRef:
    IDENTIFIER
    {
        $$ = $1;
    }
    ;

WhereClause:
    /* empty */
    {
        $$ = nullptr;
    }
    | KEYWORD_WHERE Expression
    {
        $$ = $2;
    }
    ;

GroupByClause:
    /* empty */
    {
        $$ = nullptr;
    }
    | KEYWORD_GROUP KEYWORD_BY IdentifierList
    {
        $$ = $3;
    }
    ;

IdentifierList:
    IDENTIFIER
    {
        auto list = new std::vector<std::string>();
        list->push_back($1);
        free($1);
        $$ = list;
    }
    | IdentifierList COMMA IDENTIFIER
    {
        $1->push_back($3);
        free($3);
        $$ = $1;
    }
    ;

OrderByClause:
    /* empty */
    {
        $$ = nullptr;
    }
    | KEYWORD_ORDER KEYWORD_BY OrderItemList
    {
        $$ = $3;
    }
    ;

OrderItemList:
    IDENTIFIER
    {
        auto list = new std::vector<logql::OrderByItem>();
        logql::OrderByItem item;
        item.expr = std::make_unique<logql::IdentifierNode>($1);
        item.ascending = true;
        free($1);
        list->push_back(std::move(item));
        $$ = list;
    }
    | IDENTIFIER KEYWORD_ASC
    {
        auto list = new std::vector<logql::OrderByItem>();
        logql::OrderByItem item;
        item.expr = std::make_unique<logql::IdentifierNode>($1);
        item.ascending = true;
        free($1);
        list->push_back(std::move(item));
        $$ = list;
    }
    | IDENTIFIER KEYWORD_DESC
    {
        auto list = new std::vector<logql::OrderByItem>();
        logql::OrderByItem item;
        item.expr = std::make_unique<logql::IdentifierNode>($1);
        item.ascending = false;
        free($1);
        list->push_back(std::move(item));
        $$ = list;
    }
    | FunctionCall
    {
        auto list = new std::vector<logql::OrderByItem>();
        logql::OrderByItem item;
        item.expr = std::unique_ptr<logql::ExprNode>($1);
        item.ascending = true;
        list->push_back(std::move(item));
        $$ = list;
    }
    | FunctionCall KEYWORD_ASC
    {
        auto list = new std::vector<logql::OrderByItem>();
        logql::OrderByItem item;
        item.expr = std::unique_ptr<logql::ExprNode>($1);
        item.ascending = true;
        list->push_back(std::move(item));
        $$ = list;
    }
    | FunctionCall KEYWORD_DESC
    {
        auto list = new std::vector<logql::OrderByItem>();
        logql::OrderByItem item;
        item.expr = std::unique_ptr<logql::ExprNode>($1);
        item.ascending = false;
        list->push_back(std::move(item));
        $$ = list;
    }
    | OrderItemList COMMA IDENTIFIER
    {
        logql::OrderByItem item;
        item.expr = std::make_unique<logql::IdentifierNode>($3);
        item.ascending = true;
        free($3);
        $1->push_back(std::move(item));
        $$ = $1;
    }
    | OrderItemList COMMA IDENTIFIER KEYWORD_ASC
    {
        logql::OrderByItem item;
        item.expr = std::make_unique<logql::IdentifierNode>($3);
        item.ascending = true;
        free($3);
        $1->push_back(std::move(item));
        $$ = $1;
    }
    | OrderItemList COMMA IDENTIFIER KEYWORD_DESC
    {
        logql::OrderByItem item;
        item.expr = std::make_unique<logql::IdentifierNode>($3);
        item.ascending = false;
        free($3);
        $1->push_back(std::move(item));
        $$ = $1;
    }
    ;

LimitClause:
    /* empty */
    {
        $$ = -1;
    }
    | KEYWORD_LIMIT INT_LITERAL
    {
        $$ = $2;
    }
    ;

Expression:
    Expression KEYWORD_OR Conjunction
    {
        $$ = new logql::BinaryOpNode("OR", std::unique_ptr<logql::ExprNode>($1), std::unique_ptr<logql::ExprNode>($3));
    }
    | Conjunction
    {
        $$ = $1;
    }
    ;

Conjunction:
    Conjunction KEYWORD_AND Inversion
    {
        $$ = new logql::BinaryOpNode("AND", std::unique_ptr<logql::ExprNode>($1), std::unique_ptr<logql::ExprNode>($3));
    }
    | Inversion
    {
        $$ = $1;
    }
    ;

Inversion:
    KEYWORD_NOT Inversion
    {
        $$ = new logql::UnaryOpNode("NOT", std::unique_ptr<logql::ExprNode>($2));
    }
    | Predicate
    {
        $$ = $1;
    }
    ;

Predicate:
    PrimaryExpr OP_EQ PrimaryExpr
    {
        $$ = new logql::BinaryOpNode("=", std::unique_ptr<logql::ExprNode>($1), std::unique_ptr<logql::ExprNode>($3));
    }
    | PrimaryExpr OP_NEQ PrimaryExpr
    {
        $$ = new logql::BinaryOpNode("!=", std::unique_ptr<logql::ExprNode>($1), std::unique_ptr<logql::ExprNode>($3));
    }
    | PrimaryExpr OP_LT PrimaryExpr
    {
        $$ = new logql::BinaryOpNode("<", std::unique_ptr<logql::ExprNode>($1), std::unique_ptr<logql::ExprNode>($3));
    }
    | PrimaryExpr OP_GT PrimaryExpr
    {
        $$ = new logql::BinaryOpNode(">", std::unique_ptr<logql::ExprNode>($1), std::unique_ptr<logql::ExprNode>($3));
    }
    | PrimaryExpr OP_LE PrimaryExpr
    {
        $$ = new logql::BinaryOpNode("<=", std::unique_ptr<logql::ExprNode>($1), std::unique_ptr<logql::ExprNode>($3));
    }
    | PrimaryExpr OP_GE PrimaryExpr
    {
        $$ = new logql::BinaryOpNode(">=", std::unique_ptr<logql::ExprNode>($1), std::unique_ptr<logql::ExprNode>($3));
    }
    | LPAREN Expression RPAREN
    {
        $$ = $2;
    }
    ;

PrimaryExpr:
    PrimaryExpr OP_PLUS Term
    {
        $$ = new logql::BinaryOpNode("+", std::unique_ptr<logql::ExprNode>($1), std::unique_ptr<logql::ExprNode>($3));
    }
    | PrimaryExpr OP_MINUS Term
    {
        $$ = new logql::BinaryOpNode("-", std::unique_ptr<logql::ExprNode>($1), std::unique_ptr<logql::ExprNode>($3));
    }
    | Term
    {
        $$ = $1;
    }
    ;

Term:
    Term OP_STAR Factor
    {
        $$ = new logql::BinaryOpNode("*", std::unique_ptr<logql::ExprNode>($1), std::unique_ptr<logql::ExprNode>($3));
    }
    | Term OP_SLASH Factor
    {
        $$ = new logql::BinaryOpNode("/", std::unique_ptr<logql::ExprNode>($1), std::unique_ptr<logql::ExprNode>($3));
    }
    | Factor
    {
        $$ = $1;
    }
    ;

Factor:
    IDENTIFIER
    {
        $$ = new logql::IdentifierNode($1);
        free($1);
    }
    | Literal
    {
        $$ = $1;
    }
    | FunctionCall
    {
        $$ = $1;
    }
    | LPAREN Expression RPAREN
    {
        $$ = $2;
    }
    ;

FunctionCall:
    KEYWORD_COUNT LPAREN OP_STAR RPAREN
    {
        $$ = new logql::FunctionCallNode("COUNT", "*");
    }
    | KEYWORD_COUNT LPAREN IDENTIFIER RPAREN
    {
        $$ = new logql::FunctionCallNode("COUNT", $3);
        free($3);
    }
    | KEYWORD_MIN LPAREN IDENTIFIER RPAREN
    {
        $$ = new logql::FunctionCallNode("MIN", $3);
        free($3);
    }
    | KEYWORD_MAX LPAREN IDENTIFIER RPAREN
    {
        $$ = new logql::FunctionCallNode("MAX", $3);
        free($3);
    }
    | KEYWORD_AVG LPAREN IDENTIFIER RPAREN
    {
        $$ = new logql::FunctionCallNode("AVG", $3);
        free($3);
    }
    | KEYWORD_SUM LPAREN IDENTIFIER RPAREN
    {
        $$ = new logql::FunctionCallNode("SUM", $3);
        free($3);
    }
    ;

Literal:
    INT_LITERAL
    {
        $$ = new logql::LiteralNode($1);
    }
    | FLOAT_LITERAL
    {
        $$ = new logql::LiteralNode($1);
    }
    | STRING_LITERAL
    {
        $$ = new logql::LiteralNode(std::string($1));
        free($1);
    }
    | KEYWORD_TRUE
    {
        $$ = new logql::LiteralNode(true);
    }
    | KEYWORD_FALSE
    {
        $$ = new logql::LiteralNode(false);
    }
    ;

%%

void yyerror(const char* s) {
    g_parseError = s;
    g_errorLine = yylineno;
    g_errorCol = yycolumn;
}
