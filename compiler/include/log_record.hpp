#ifndef LOGQL_LOG_RECORD_HPP
#define LOGQL_LOG_RECORD_HPP

#include <string>
#include <variant>
#include <vector>
#include <sstream>
#include <iomanip>
#include "json.hpp"

namespace logql {

enum class DataType {
    TYPE_NULL,
    TYPE_INT,
    TYPE_FLOAT,
    TYPE_STRING,
    TYPE_BOOL
};

inline std::string dataTypeToString(DataType type) {
    switch (type) {
        case DataType::TYPE_NULL: return "NULL";
        case DataType::TYPE_INT: return "INTEGER";
        case DataType::TYPE_FLOAT: return "FLOAT";
        case DataType::TYPE_STRING: return "STRING";
        case DataType::TYPE_BOOL: return "BOOLEAN";
        default: return "UNKNOWN";
    }
}

class FieldValue {
public:
    using ValueVariant = std::variant<std::monostate, int64_t, double, std::string, bool>;
    ValueVariant value;

    FieldValue() : value(std::monostate{}) {}
    FieldValue(int64_t val) : value(val) {}
    FieldValue(int val) : value(static_cast<int64_t>(val)) {}
    FieldValue(double val) : value(val) {}
    FieldValue(const std::string& val) : value(val) {}
    FieldValue(const char* val) : value(std::string(val)) {}
    FieldValue(bool val) : value(val) {}

    DataType getType() const {
        if (std::holds_alternative<int64_t>(value)) return DataType::TYPE_INT;
        if (std::holds_alternative<double>(value)) return DataType::TYPE_FLOAT;
        if (std::holds_alternative<std::string>(value)) return DataType::TYPE_STRING;
        if (std::holds_alternative<bool>(value)) return DataType::TYPE_BOOL;
        return DataType::TYPE_NULL;
    }

    bool isNull() const {
        return std::holds_alternative<std::monostate>(value);
    }

    bool isNumeric() const {
        return std::holds_alternative<int64_t>(value) || std::holds_alternative<double>(value);
    }

    int64_t asInt() const {
        if (std::holds_alternative<int64_t>(value)) return std::get<int64_t>(value);
        if (std::holds_alternative<double>(value)) return static_cast<int64_t>(std::get<double>(value));
        if (std::holds_alternative<bool>(value)) return std::get<bool>(value) ? 1 : 0;
        if (std::holds_alternative<std::string>(value)) {
            try { return std::stoll(std::get<std::string>(value)); } catch (...) { return 0; }
        }
        return 0;
    }

    double asFloat() const {
        if (std::holds_alternative<double>(value)) return std::get<double>(value);
        if (std::holds_alternative<int64_t>(value)) return static_cast<double>(std::get<int64_t>(value));
        if (std::holds_alternative<bool>(value)) return std::get<bool>(value) ? 1.0 : 0.0;
        if (std::holds_alternative<std::string>(value)) {
            try { return std::stod(std::get<std::string>(value)); } catch (...) { return 0.0; }
        }
        return 0.0;
    }

    std::string asString() const {
        if (std::holds_alternative<std::string>(value)) return std::get<std::string>(value);
        if (std::holds_alternative<int64_t>(value)) return std::to_string(std::get<int64_t>(value));
        if (std::holds_alternative<double>(value)) {
            std::ostringstream ss;
            ss << std::fixed << std::setprecision(2) << std::get<double>(value);
            return ss.str();
        }
        if (std::holds_alternative<bool>(value)) return std::get<bool>(value) ? "TRUE" : "FALSE";
        return "NULL";
    }

    bool asBool() const {
        if (std::holds_alternative<bool>(value)) return std::get<bool>(value);
        if (std::holds_alternative<int64_t>(value)) return std::get<int64_t>(value) != 0;
        if (std::holds_alternative<double>(value)) return std::get<double>(value) != 0.0;
        if (std::holds_alternative<std::string>(value)) {
            const auto& s = std::get<std::string>(value);
            return !s.empty() && s != "0" && s != "false" && s != "FALSE";
        }
        return false;
    }

    nlohmann::json toJson() const {
        if (std::holds_alternative<int64_t>(value)) return std::get<int64_t>(value);
        if (std::holds_alternative<double>(value)) return std::get<double>(value);
        if (std::holds_alternative<std::string>(value)) return std::get<std::string>(value);
        if (std::holds_alternative<bool>(value)) return std::get<bool>(value);
        return nullptr;
    }
};

struct LogRecord {
    std::string timestamp;
    std::string service;
    std::string level;
    int64_t status{0};
    double response_time{0.0};
    std::string path;
    std::string ip;
    std::string message;

    FieldValue getField(const std::string& fieldName) const {
        if (fieldName == "timestamp") return FieldValue(timestamp);
        if (fieldName == "service") return FieldValue(service);
        if (fieldName == "level") return FieldValue(level);
        if (fieldName == "status") return FieldValue(status);
        if (fieldName == "response_time") return FieldValue(response_time);
        if (fieldName == "path") return FieldValue(path);
        if (fieldName == "ip") return FieldValue(ip);
        if (fieldName == "message") return FieldValue(message);
        return FieldValue();
    }

    static bool isValidField(const std::string& fieldName) {
        return fieldName == "timestamp" ||
               fieldName == "service" ||
               fieldName == "level" ||
               fieldName == "status" ||
               fieldName == "response_time" ||
               fieldName == "path" ||
               fieldName == "ip" ||
               fieldName == "message";
    }

    static DataType getFieldType(const std::string& fieldName) {
        if (fieldName == "status") return DataType::TYPE_INT;
        if (fieldName == "response_time") return DataType::TYPE_FLOAT;
        return DataType::TYPE_STRING;
    }

    static LogRecord fromJson(const nlohmann::json& j) {
        LogRecord r;
        if (j.contains("timestamp") && j["timestamp"].is_string()) r.timestamp = j["timestamp"].get<std::string>();
        if (j.contains("service") && j["service"].is_string()) r.service = j["service"].get<std::string>();
        if (j.contains("level") && j["level"].is_string()) r.level = j["level"].get<std::string>();
        if (j.contains("status")) {
            if (j["status"].is_number_integer()) r.status = j["status"].get<int64_t>();
            else if (j["status"].is_number()) r.status = static_cast<int64_t>(j["status"].get<double>());
            else if (j["status"].is_string()) {
                try { r.status = std::stoll(j["status"].get<std::string>()); } catch (...) { r.status = 0; }
            }
        }
        if (j.contains("response_time")) {
            if (j["response_time"].is_number()) r.response_time = j["response_time"].get<double>();
            else if (j["response_time"].is_string()) {
                try { r.response_time = std::stod(j["response_time"].get<std::string>()); } catch (...) { r.response_time = 0.0; }
            }
        }
        if (j.contains("path") && j["path"].is_string()) r.path = j["path"].get<std::string>();
        if (j.contains("ip") && j["ip"].is_string()) r.ip = j["ip"].get<std::string>();
        if (j.contains("message") && j["message"].is_string()) r.message = j["message"].get<std::string>();
        return r;
    }

    nlohmann::json toJson() const {
        return {
            {"timestamp", timestamp},
            {"service", service},
            {"level", level},
            {"status", status},
            {"response_time", response_time},
            {"path", path},
            {"ip", ip},
            {"message", message}
        };
    }
};

} // namespace logql

#endif // LOGQL_LOG_RECORD_HPP
