CXX ?= g++
CXXFLAGS = -std=c++17 -O2 -Wall -Wextra -Iinclude

FLEX ?= win_flex
BISON ?= win_bison

# Check if win_flex is available, else fallback to flex
ifeq ($(OS),Windows_NT)
    EXE_EXT = .exe
    MKDIR = if not exist build mkdir build
else
    EXE_EXT =
    FLEX = flex
    BISON = bison
    MKDIR = mkdir -p build
endif

TARGET = build/logql_cli$(EXE_EXT)

SRCS = src/ast.cpp src/semantic.cpp src/optimizer.cpp src/execution_plan.cpp src/executor.cpp src/main.cpp
PARSER_GEN = parser.tab.cpp parser.tab.hpp
LEXER_GEN = lex.yy.cpp

all: $(TARGET)

$(PARSER_GEN): parser.y
	$(BISON) -d -o parser.tab.cpp parser.y

$(LEXER_GEN): lexer.l $(PARSER_GEN)
	$(FLEX) -o lex.yy.cpp lexer.l

$(TARGET): $(PARSER_GEN) $(LEXER_GEN) $(SRCS)
	$(MKDIR)
	$(CXX) $(CXXFLAGS) parser.tab.cpp lex.yy.cpp $(SRCS) -o $(TARGET)

TEST_TARGET = build/test_compiler$(EXE_EXT)
TEST_SRCS = src/ast.cpp src/semantic.cpp src/optimizer.cpp src/execution_plan.cpp src/executor.cpp tests/test_compiler.cpp

test: $(PARSER_GEN) $(LEXER_GEN) $(TEST_SRCS)
	$(MKDIR)
	$(CXX) $(CXXFLAGS) parser.tab.cpp lex.yy.cpp $(TEST_SRCS) -o $(TEST_TARGET)
	$(TEST_TARGET)

clean:
	rm -f parser.tab.cpp parser.tab.hpp parser.output lex.yy.cpp $(TARGET) $(TEST_TARGET)

.PHONY: all test clean
