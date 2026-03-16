import { gql } from "@apollo/client";

export const EMPLOYEE_DASHBOARD_QUERY = gql`
  query EmployeeDashboard {
    me {
      id
      fullName
      name
      email
      role
      department
      responsibilityLevel
      employmentStatus
      hireDate
      okrStatus
      okrSubmitted
      lateArrivalCount
      employeeCode
    }
    myBenefits {
      status
      canRequest
      failureReasons
      benefit {
        id
        name
        category
        subsidyPercent
        vendorName
        requiresContract
        activeContractId
        isActive
      }
      eligibility {
        employeeId
        benefitId
        status
        ruleEvaluationJson
        computedAt
        overrideReason
      }
      latestRequest {
        id
        benefitId
        status
        contractVersionAccepted
        contractAcceptedAt
        reviewedBy
        createdAt
        updatedAt
      }
      activeContract {
        id
        benefitId
        vendorName
        version
        effectiveDate
        expiryDate
        isActive
      }
    }
  }
`;

export const MY_BENEFITS_QUERY = gql`
  query MyBenefits {
    myBenefits {
      status
      canRequest
      failureReasons
      benefit {
        id
        name
        category
        subsidyPercent
        vendorName
        requiresContract
        activeContractId
        isActive
      }
      eligibility {
        employeeId
        benefitId
        status
        ruleEvaluationJson
        computedAt
        overrideReason
      }
      latestRequest {
        id
        benefitId
        status
        contractVersionAccepted
        contractAcceptedAt
        reviewedBy
        createdAt
        updatedAt
      }
      activeContract {
        id
        benefitId
        vendorName
        version
        effectiveDate
        expiryDate
        isActive
      }
    }
  }
`;

export const MY_REQUESTS_QUERY = gql`
  query MyRequests {
    myRequests {
      benefit {
        id
        name
      }
      request {
        id
        benefitId
        status
        reviewedBy
        createdAt
        updatedAt
      }
    }
  }
`;

export const REQUEST_BENEFIT_MUTATION = gql`
  mutation RequestBenefit($input: RequestBenefitInput!) {
    requestBenefit(input: $input) {
      requiresContractAcceptance
      benefit {
        id
        name
        category
        subsidyPercent
        vendorName
        requiresContract
        activeContractId
        isActive
      }
      eligibility {
        employeeId
        benefitId
        status
        ruleEvaluationJson
        computedAt
        overrideReason
      }
      activeContract {
        id
        benefitId
        vendorName
        version
        effectiveDate
        expiryDate
        isActive
      }
      existingRequest {
        id
        benefitId
        status
        contractVersionAccepted
        contractAcceptedAt
        reviewedBy
        createdAt
        updatedAt
      }
    }
  }
`;

export const CONFIRM_BENEFIT_REQUEST_MUTATION = gql`
  mutation ConfirmBenefitRequest($input: ConfirmBenefitRequestInput!) {
    confirmBenefitRequest(input: $input) {
      id
      benefitId
      status
      contractVersionAccepted
      contractAcceptedAt
      reviewedBy
      createdAt
      updatedAt
    }
  }
`;
