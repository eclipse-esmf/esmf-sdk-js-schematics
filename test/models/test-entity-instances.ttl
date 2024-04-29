/*
 * Copyright (c) 2023 Robert Bosch Manufacturing Solutions GmbH
 *
 * See the AUTHORS file(s) distributed with this work for
 * additional information regarding authorship.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * SPDX-License-Identifier: MPL-2.0
 */

export const testAspectModel = `
@prefix : <urn:samm:org.eclipse.esmf.test:1.0.0#> .
@prefix samm: <urn:samm:org.eclipse.esmf.samm:meta-model:2.1.0#> .
@prefix samm-c: <urn:samm:org.eclipse.esmf.samm:characteristic:2.1.0#> .
@prefix unit: <urn:samm:org.eclipse.esmf.samm:unit:2.1.0#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

:TestAspect a samm:Aspect ;
   samm:name "TestAspect" ;
   samm:properties ( :testProperty [ samm:property :testProperty ; samm:optional "true"^^xsd:boolean; samm:exampleValue "5"^^xsd:int ] :procedureAndStepIdentification ) ;
   samm:operations () .

:testProperty a samm:Property ;
  samm:name "testProperty" ;
  samm:preferredName "Test Property EN"@en ;
  samm:preferredName "Test Property DE"@de ;
  samm:description "This is a test property EN."@en ;
  samm:description "This is a test property DE."@de ;
  samm:exampleValue "5.7"^^xsd:float.
  
:procedureAndStepIdentification a samm:Property ;
   samm:name "procedureAndStepIdentification" ;
   samm:preferredName "Procedure And Step Identification"@en ;
   samm:description "The identification code for the procedure and execution step in which the system finds itself."@en ;
   samm:characteristic [
      a samm-c:Enumeration ;
      samm:name "ProcedureAndStepNumbers" ;
      samm:preferredName "Procedure And Step Number"@en ;
      samm:description "Defines the codes which represent the state of the system."@en ;
      samm:dataType :ProcedureAndStepNumber ;
      samm-c:values ( :Code101 :Code102 )
   ] .

:ProcedureAndStepNumber a samm:Entity ;
   samm:name "ProcedureAndStepNumber" ;
   samm:preferredName "Procedure And Step Number"@en ;
   samm:description "Represents a code which represents a specific system state."@en ;
   samm:properties ( :iProcedureAndStepNo
                     [ samm:property :description ; samm:notInPayload "true"^^xsd:boolean ] ) .
                     
:Code101 a :ProcedureAndStepNumber ;
   :iProcedureAndStepNo "101"^^xsd:short ;
   :description "Starting" .

:Code102 a :ProcedureAndStepNumber ;
   :iProcedureAndStepNo "102"^^xsd:short ;
   :description "Ready" .

:iProcedureAndStepNo a samm:Property ;
   samm:name "iProcedureAndStepNo" ;
   samm:preferredName "Code"@en ;
   samm:description "The code which represents a specific system state."@en ;
   samm:characteristic :NumericCode .

:NumericCode a samm-c:Code ;
   samm:name "NumericCode" ;
   samm:preferredName "Numeric Code"@en ;
   samm:description "A numeric code"@en ;
   samm:dataType xsd:short .       
`;
