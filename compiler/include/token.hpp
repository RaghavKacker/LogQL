#ifndef LOGQL_TOKEN_HPP
#define LOGQL_TOKEN_HPP

#include <string>
#include <vector>
#include "json.hpp"

namespace logql {

enum class TokenType {
    // Keywords
    KEYWORD_SELECT,
    KEYWORD_FROM,
    KEYWORD_WHERE,
    KEYWORD_GROUP,
    KEYWORD_BY,
    KEYWORD_ORDER,
    KEYWORD_ASC,
    KEYWORD_DESC,
    KEYWORD_LIMIT,
    KEYWORD_DISTINCT,
    KEYWORD_AS,
    KEYWORD_AND,
    KEYWORD_OR,
    KEYWORD_NOT,
    KEYWORD_COUNT,
    KEYWORD_MIN,
    KEYWORD_MAX,
    KEYWORD_AVG,
    KEYWORD_SUM,
    KEYWORD_TRUE,
    KEYWORD_FALSE,
    KEYWORD_NULL,

    // Identifiers & Literals
    IDENTIFIER,
    INT_LITERAL,
    FLOAT_LITERAL,
    STRING_LITERAL,
    BOOL_LITERAL,

    // Operators
    OP_EQ,
    OP_NEQ,
    OP_LT,
    OP_GT,
    OP_LE,
    OP_GE,
    OP_PLUS,
    OP_MINUS,
    OP_STAR,
    OP_SLASH,

    // Punctuation
    LPAREN,
    RPAREN,
    COMMA,
    SEMICOLON,

    // Meta
    END_OF_FILE,
    LEXICAL_ERROR
};

inline std::string tokenTypeToString(TokenType type) {
    switch (type) {
        case TokenType::KEYWORD_SELECT: return "KEYWORD_SELECT";
        case TokenType::KEYWORD_FROM: return "KEYWORD_FROM";
        case TokenType::KEYWORD_WHERE: return "KEYWORD_WHERE";
        case TokenType::KEYWORD_GROUP: return "KEYWORD_GROUP";
        case TokenType::KEYWORD_BY: return "KEYWORD_BY";
        case TokenType::KEYWORD_ORDER: return "KEYWORD_ORDER";
        case TokenType::KEYWORD_ASC: return "KEYWORD_ASC";
        case TokenType::KEYWORD_DESC: return "KEYWORD_DESC";
        case TokenType::KEYWORD_LIMIT: return "KEYWORD_LIMIT";
        case TokenType::KEYWORD_DISTINCT: return "KEYWORD_DISTINCT";
        case TokenType::KEYWORD_AS: return "KEYWORD_AS";
        case TokenType::KEYWORD_AND: return "KEYWORD_AND";
        case TokenType::KEYWORD_OR: return "KEYWORD_OR";
        case TokenType::KEYWORD_NOT: return "KEYWORD_NOT";
        case TokenType::KEYWORD_COUNT: return "KEYWORD_COUNT";
        case TokenType::KEYWORD_MIN: return "KEYWORD_MIN";
        case TokenType::KEYWORD_MAX: return "KEYWORD_MAX";
        case TokenType::KEYWORD_AVG: return "KEYWORD_AVG";
        case TokenType::KEYWORD_SUM: return "KEYWORD_SUM";
        case TokenType::KEYWORD_TRUE: return "KEYWORD_TRUE";
        case TokenType::KEYWORD_FALSE: return "KEYWORD_FALSE";
        case TokenType::KEYWORD_NULL: return "KEYWORD_NULL";
        case TokenType::IDENTIFIER: return "IDENTIFIER";
        case TokenType::INT_LITERAL: return "INT_LITERAL";
        case TokenType::FLOAT_LITERAL: return "FLOAT_LITERAL";
        case TokenType::STRING_LITERAL: return "STRING_LITERAL";
        case TokenType::BOOL_LITERAL: return "BOOL_LITERAL";
        case TokenType::OP_EQ: return "OP_EQ";
        case TokenType::OP_NEQ: return "OP_NEQ";
        case TokenType::OP_LT: return "OP_LT";
        case TokenType::OP_GT: return "OP_GT";
        case TokenType::OP_LE: return "OP_LE";
        case TokenType::OP_GE: return "OP_GE";
        case TokenType::OP_PLUS: return "OP_PLUS";
        case TokenType::OP_MINUS: return "OP_MINUS";
        case TokenType::OP_STAR: return "OP_STAR";
        case TokenType::OP_SLASH: return "OP_SLASH";
        case TokenType::LPAREN: return "LPAREN";
        case TokenType::RPAREN: return "RPAREN";
        case TokenType::COMMA: return "COMMA";
        case TokenType::SEMICOLON: return "SEMICOLON";
        case TokenType::END_OF_FILE: return "END_OF_FILE";
        case TokenType::LEXICAL_ERROR: return "LEXICAL_ERROR";
        default: return "UNKNOWN";
    }
}

struct Token {
    TokenType type;
    std::string lexeme;
    int line;
    int col;

    nlohmann::json toJson() const {
        return {
            {"token", tokenTypeToString(type)},
            {"lexeme", lexeme},
            {"line", line},
            {"col", col}
        };
    }
};

} // namespace logql

#endif // LOGQL_TOKEN_HPP
